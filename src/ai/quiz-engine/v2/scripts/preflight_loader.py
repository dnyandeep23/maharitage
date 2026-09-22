import json
import os
import time
import argparse
import hashlib
import traceback
from PIL import Image

import torch
try:
    import mlx.core as mx
    from mlx_vlm import load, generate
except ImportError:
    pass

from transformers import AutoProcessor, AutoConfig

class ModelAdapter:
    def __init__(self, model_id, precision):
        self.model_id = model_id
        self.precision = precision
        self.processor = None
        self.model = None

    def load(self):
        raise NotImplementedError

    def generate(self, prompt_text, image_path):
        raise NotImplementedError

class SmolVLMAdapter(ModelAdapter):
    def load(self):
        # SmolVLM usually uses AutoProcessor and AutoModelForVision2Seq.
        # But if AutoModelForVision2Seq is missing, we use AutoModelForImageTextToText or AutoModel.
        try:
            from transformers import AutoModelForVision2Seq
            model_cls = AutoModelForVision2Seq
        except ImportError:
            from transformers import AutoModelForImageTextToText
            model_cls = AutoModelForImageTextToText
            
        self.processor = AutoProcessor.from_pretrained(self.model_id)
        self.model = model_cls.from_pretrained(
            self.model_id,
            torch_dtype=torch.bfloat16 if self.precision == "bfloat16" else torch.float16,
            device_map="auto"
        ).eval()

    def generate(self, prompt_text, image_path):
        messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}]
        image = Image.open(image_path).convert("RGB")
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        inputs = self.processor(text=prompt, images=[image], return_tensors="pt").to(self.model.device)
        with torch.no_grad():
            generated_ids = self.model.generate(**inputs, max_new_tokens=10, do_sample=False)
        generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
        return self.processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]

class LlavaAdapter(ModelAdapter):
    def load(self):
        try:
            from transformers import LlavaOnevisionForConditionalGeneration
            model_cls = LlavaOnevisionForConditionalGeneration
        except ImportError:
            try:
                from transformers import AutoModelForVision2Seq
                model_cls = AutoModelForVision2Seq
            except ImportError:
                from transformers import AutoModelForImageTextToText
                model_cls = AutoModelForImageTextToText
                
        self.processor = AutoProcessor.from_pretrained(self.model_id)
        self.model = model_cls.from_pretrained(
            self.model_id,
            torch_dtype=torch.bfloat16 if self.precision == "bfloat16" else torch.float16,
            device_map="auto"
        ).eval()

    def generate(self, prompt_text, image_path):
        messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}]
        image = Image.open(image_path).convert("RGB")
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        inputs = self.processor(text=prompt, images=[image], return_tensors="pt").to(self.model.device)
        with torch.no_grad():
            generated_ids = self.model.generate(**inputs, max_new_tokens=10, do_sample=False)
        generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
        return self.processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]

class QwenMLXAdapter(ModelAdapter):
    def load(self):
        self.model, self.processor = load(self.model_id)

    def generate(self, prompt_text, image_path):
        messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}]
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        return generate(self.model, self.processor, prompt, [image_path], verbose=False, max_tokens=10, temp=0.0)

class QwenTransformersAdapter(ModelAdapter):
    def load(self):
        from transformers import Qwen2VLForConditionalGeneration
        # If Qwen2.5 or Qwen3 has its own, we will rely on trust_remote_code=True with AutoModelForCausalLM
        # or use AutoModelForImageTextToText
        try:
            from transformers import AutoModelForImageTextToText
            model_cls = AutoModelForImageTextToText
        except ImportError:
            model_cls = Qwen2VLForConditionalGeneration
            
        self.processor = AutoProcessor.from_pretrained(self.model_id, trust_remote_code=True)
        try:
            self.model = model_cls.from_pretrained(
                self.model_id,
                torch_dtype=torch.bfloat16 if self.precision == "bfloat16" else torch.float16,
                device_map="auto",
                trust_remote_code=True
            ).eval()
        except Exception as e:
            # Fallback for Qwen models that register as CausalLM
            from transformers import AutoModelForCausalLM
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_id,
                torch_dtype=torch.bfloat16 if self.precision == "bfloat16" else torch.float16,
                device_map="auto",
                trust_remote_code=True
            ).eval()

    def generate(self, prompt_text, image_path):
        messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}]
        image = Image.open(image_path).convert("RGB")
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        inputs = self.processor(text=prompt, images=[image], return_tensors="pt").to(self.model.device)
        with torch.no_grad():
            generated_ids = self.model.generate(**inputs, max_new_tokens=10, do_sample=False)
        generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
        return self.processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]

class InternVLAdapter(ModelAdapter):
    def load(self):
        # Official InternVL loading path usually involves AutoModel with trust_remote_code
        from transformers import AutoModel
        self.processor = AutoProcessor.from_pretrained(self.model_id, trust_remote_code=True)
        self.model = AutoModel.from_pretrained(
            self.model_id,
            torch_dtype=torch.bfloat16 if self.precision == "bfloat16" else torch.float16,
            device_map="auto",
            trust_remote_code=True
        ).eval()

    def generate(self, prompt_text, image_path):
        messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}]
        # InternVL might have a different chat template or process, but we'll try the standard AutoProcessor one first
        try:
            image = Image.open(image_path).convert("RGB")
            prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
            inputs = self.processor(text=prompt, images=[image], return_tensors="pt").to(self.model.device)
            with torch.no_grad():
                generated_ids = self.model.generate(**inputs, max_new_tokens=10, do_sample=False)
            generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
            return self.processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]
        except Exception as e:
            # Fallback if apply_chat_template fails for InternVL
            return f"GENERATION_ERROR: {e}"

class GemmaAdapter(ModelAdapter):
    def load(self):
        try:
            from transformers import AutoModelForImageTextToText
            model_cls = AutoModelForImageTextToText
        except ImportError:
            from transformers import AutoModelForCausalLM
            model_cls = AutoModelForCausalLM
            
        self.processor = AutoProcessor.from_pretrained(self.model_id)
        self.model = model_cls.from_pretrained(
            self.model_id,
            torch_dtype=torch.bfloat16 if self.precision == "bfloat16" else torch.float16,
            device_map="auto"
        ).eval()

    def generate(self, prompt_text, image_path):
        messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}]
        image = Image.open(image_path).convert("RGB")
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        inputs = self.processor(text=prompt, images=[image], return_tensors="pt").to(self.model.device)
        with torch.no_grad():
            generated_ids = self.model.generate(**inputs, max_new_tokens=10, do_sample=False)
        generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
        return self.processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]

MODELS = {
    "SmolVLM-256M": {"id": "HuggingFaceTB/SmolVLM-256M-Instruct", "precision": "bfloat16", "adapter": SmolVLMAdapter},
    "SmolVLM-500M": {"id": "HuggingFaceTB/SmolVLM-500M-Instruct", "precision": "bfloat16", "adapter": SmolVLMAdapter},
    "llava-onevision-0.5b": {"id": "llava-hf/llava-onevision-qwen2-0.5b-ov-hf", "precision": "float16", "adapter": LlavaAdapter},
    "Qwen2-VL-2B-MLX": {"id": "mlx-community/Qwen2-VL-2B-Instruct-4bit", "precision": "4-bit", "adapter": QwenMLXAdapter},
    "Qwen3-VL-2B": {"id": "Qwen/Qwen3-VL-2B-Instruct", "precision": "bfloat16", "adapter": QwenTransformersAdapter},
    "Qwen2.5-VL-3B": {"id": "Qwen/Qwen2.5-VL-3B-Instruct", "precision": "bfloat16", "adapter": QwenTransformersAdapter},
    "Qwen3-VL-4B": {"id": "Qwen/Qwen3-VL-4B-Instruct", "precision": "bfloat16", "adapter": QwenTransformersAdapter},
    "InternVL3-2B": {"id": "OpenGVLab/InternVL3-2B", "precision": "bfloat16", "adapter": InternVLAdapter},
    "gemma-3-4b-it": {"id": "google/gemma-3-4b-it", "precision": "bfloat16", "adapter": GemmaAdapter}
}

SYSTEM_PROMPT = """You are answering a multiple-choice Maharashtra heritage question.

Choose exactly one option: A, B, C, or D.

Return only:

ANSWER: A"""

def build_image_map(base_dir="src/ai/quiz-engine/v2/dataset"):
    image_map = {}
    for site in os.listdir(base_dir):
        ann_path = os.path.join(base_dir, site, "image", "annotations.json")
        if os.path.exists(ann_path):
            with open(ann_path) as f:
                data = json.load(f)
                for q in data:
                    if q.get('image_url'):
                        url = q['image_url']
                        url_hash = hashlib.md5(url.encode()).hexdigest()[:6]
                        img_id = f"{site}_img_{url_hash}"
                        filename = url.split('/')[-1]
                        image_map[img_id] = os.path.join("src/ai/quiz-engine/v2/benchmark/images", filename)
    return image_map

def parse_answer(text):
    if not text: return "INVALID"
    text = text.strip()
    if text in ["A", "B", "C", "D"]: return text
    if "ANSWER: A" in text.upper(): return "A"
    if "ANSWER: B" in text.upper(): return "B"
    if "ANSWER: C" in text.upper(): return "C"
    if "ANSWER: D" in text.upper(): return "D"
    if "OPTION A" in text.upper(): return "A"
    if "OPTION B" in text.upper(): return "B"
    if "OPTION C" in text.upper(): return "C"
    if "OPTION D" in text.upper(): return "D"
    parts = text.split()
    if len(parts) > 0 and parts[-1].upper() in ["A", "B", "C", "D"]:
        return parts[-1].upper()
    return "INVALID"

def format_question(q):
    prompt = f"{SYSTEM_PROMPT}\n\nQuestion: {q['question']}\n"
    for opt in ['A', 'B', 'C', 'D']:
        prompt += f"{opt}: {q['options'][opt]}\n"
    return prompt

def main():
    print("Running Preflight Loader Test...")
    image_map = build_image_map()
    with open("src/ai/quiz-engine/v2/benchmark/v2_final_master.json") as f:
        dataset = json.load(f)
        
    sample_q = next(q for q in dataset if q['question_type'] == 'IMAGE_MCQ')
    prompt_text = format_question(sample_q)
    image_path = image_map.get(sample_q['image_id'])
    
    results = []
    ready_count = 0
    failed_count = 0
    
    for m_name, m_info in MODELS.items():
        print(f"\n--- Testing {m_name} ---")
        adapter_cls = m_info["adapter"]
        adapter = adapter_cls(m_info["id"], m_info["precision"])
        
        load_status = "OK"
        output = ""
        parsed = "INVALID"
        status = "READY"
        
        try:
            adapter.load()
        except Exception as e:
            err_str = str(e)
            print(f"Load Error: {err_str}")
            if "403" in err_str or "gated repo" in err_str.lower():
                status = "AUTH_REQUIRED"
            else:
                status = "LOAD_FAILED"
            load_status = "FAILED"
            
        if load_status == "OK":
            try:
                output = adapter.generate(prompt_text, image_path)
                parsed = parse_answer(output)
                if parsed not in ["A", "B", "C", "D"]:
                    status = "RUNTIME_FAILED"
            except Exception as e:
                print(f"Inference Error: {e}")
                output = f"ERROR: {e}"
                status = "RUNTIME_FAILED"
                
        if status == "READY": ready_count += 1
        else: failed_count += 1
                
        results.append({
            "model": m_name,
            "repo": m_info["id"],
            "loader": adapter_cls.__name__,
            "load_status": load_status,
            "output": output.replace("\n", " ").strip() if output else "",
            "status": status
        })
        
    md_path = "src/ai/quiz-engine/v2/reports/model_loader_preflight.md"
    os.makedirs(os.path.dirname(md_path), exist_ok=True)
    with open(md_path, "w") as f:
        f.write("# Model Loader Preflight Report\n\n")
        f.write("| Model | Repo | Loader | Load | Image Inference | Output | Status |\n")
        f.write("|------|------|--------|------|-----------------|--------|--------|\n")
        
        for r in results:
            inf = "OK" if r['status'] == "READY" else "FAILED"
            out_trunc = (r['output'][:50] + '...') if len(r['output']) > 50 else r['output']
            f.write(f"| {r['model']} | {r['repo']} | {r['loader']} | {r['load_status']} | {inf} | {out_trunc} | {r['status']} |\n")
            
        f.write(f"\n**READY_MODELS**: {ready_count}\n")
        f.write(f"**FAILED_MODELS**: {failed_count}\n")
        f.write("\n**LOADER_ERRORS**:\n")
        for r in results:
            if r['status'] not in ["READY", "AUTH_REQUIRED"]:
                f.write(f"- {r['model']}: {r['output']}\n")

if __name__ == "__main__":
    main()
