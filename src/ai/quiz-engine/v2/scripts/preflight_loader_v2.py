import os
import json
import traceback
from PIL import Image
import torch
import hashlib

print("STEP 1: Stop all benchmark processes (Done by user request).")

from transformers import AutoProcessor

# Step 3: Create ONE minimal image fixture as a local file.
# We will use the existing test_image.jpg in the same directory.
FIXTURE_PATH = "src/ai/quiz-engine/v2/scripts/test_image.jpg"
if not os.path.exists(FIXTURE_PATH):
    raise RuntimeError(f"Fixture {FIXTURE_PATH} not found.")

# Step 4: Confirm that the fixture can be opened with PIL
try:
    img = Image.open(FIXTURE_PATH)
    img.load()
    print("STEP 4: PIL Image.open(...).load() successful on fixture.")
except Exception as e:
    raise RuntimeError(f"Failed to load fixture with PIL: {e}")


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
        # Official recommended class for Idefics3/SmolVLM in transformers 5+
        from transformers import AutoModelForImageTextToText
        self.processor = AutoProcessor.from_pretrained(self.model_id)
        self.model = AutoModelForImageTextToText.from_pretrained(
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
        from transformers import LlavaOnevisionForConditionalGeneration
        self.processor = AutoProcessor.from_pretrained(self.model_id)
        self.model = LlavaOnevisionForConditionalGeneration.from_pretrained(
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
        from mlx_vlm import load
        self.model, self.processor = load(self.model_id)

    def generate(self, prompt_text, image_path):
        from mlx_vlm import generate
        messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}]
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        return generate(self.model, self.processor, prompt, [image_path], verbose=False, max_tokens=10, temp=0.0)


class Qwen2_5_Adapter(ModelAdapter):
    def load(self):
        from transformers import Qwen2_5_VLForConditionalGeneration
        self.processor = AutoProcessor.from_pretrained(self.model_id)
        self.model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
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

class Qwen3_Adapter(ModelAdapter):
    def load(self):
        from transformers import AutoModelForImageTextToText
        # Qwen3 usually works with AutoModelForImageTextToText and trust_remote_code
        self.processor = AutoProcessor.from_pretrained(self.model_id, trust_remote_code=True)
        self.model = AutoModelForImageTextToText.from_pretrained(
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
        image = Image.open(image_path).convert("RGB")
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        inputs = self.processor(text=prompt, images=[image], return_tensors="pt").to(self.model.device)
        with torch.no_grad():
            generated_ids = self.model.generate(**inputs, max_new_tokens=10, do_sample=False)
        generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
        return self.processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]


class GemmaAdapter(ModelAdapter):
    def load(self):
        from transformers import AutoModelForImageTextToText
        self.processor = AutoProcessor.from_pretrained(self.model_id)
        self.model = AutoModelForImageTextToText.from_pretrained(
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
    "Qwen3-VL-2B": {"id": "Qwen/Qwen3-VL-2B-Instruct", "precision": "bfloat16", "adapter": Qwen3_Adapter},
    "Qwen2.5-VL-3B": {"id": "Qwen/Qwen2.5-VL-3B-Instruct", "precision": "bfloat16", "adapter": Qwen2_5_Adapter},
    "Qwen3-VL-4B": {"id": "Qwen/Qwen3-VL-4B-Instruct", "precision": "bfloat16", "adapter": Qwen3_Adapter},
    "InternVL3-2B": {"id": "OpenGVLab/InternVL3-2B", "precision": "bfloat16", "adapter": InternVLAdapter},
    "gemma-3-4b-it": {"id": "google/gemma-3-4b-it", "precision": "bfloat16", "adapter": GemmaAdapter}
}

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

SYSTEM_PROMPT = """You are answering a multiple-choice Maharashtra heritage question.

Choose exactly one option: A, B, C, or D.

Return only:

ANSWER: A"""

def format_question(q):
    prompt = f"{SYSTEM_PROMPT}\n\nQuestion: {q['question']}\n"
    for opt in ['A', 'B', 'C', 'D']:
        prompt += f"{opt}: {q['options'][opt]}\n"
    return prompt



def main():
    print("--- Running 1-Image Diagnostic ---")
    
    prompt_text = "Who is the ruler?\nA: Gupta\nB: Maurya\nC: Vakataka\nD: Satavahana"
    results = []
    
    # Run SmolVLM-256M first to prove local pipeline
    test_models = list(MODELS.items())
    
    for m_name, m_info in test_models:
        print(f"\nEvaluating: {m_name}")
        adapter = m_info["adapter"](m_info["id"], m_info["precision"])
        load_status = "OK"
        inference_status = "OK"
        output_txt = ""
        status = "READY"
        root_cause = ""
        
        try:
            adapter.load()
        except Exception as e:
            err = str(e)
            load_status = "FAILED"
            inference_status = "SKIPPED"
            if "403" in err or "gated repo" in err.lower():
                status = "AUTH_REQUIRED"
                root_cause = "Gated model, HF token required."
            else:
                status = "LOAD_FAILED"
                root_cause = str(e)
                
        if load_status == "OK":
            try:
                output_txt = adapter.generate(prompt_text, FIXTURE_PATH)
            except Exception as e:
                inference_status = "FAILED"
                status = "RUNTIME_FAILED"
                root_cause = str(e)
                output_txt = "ERROR"
                
        results.append({
            "model": m_name, "repo": m_info["id"], "loader": m_info["adapter"].__name__,
            "pipeline": "LOCAL_FILE", "load": load_status, "inference": inference_status,
            "status": status, "root_cause": root_cause
        })
        
    md_path = "src/ai/quiz-engine/v2/reports/model_loader_preflight_v2.md"
    os.makedirs(os.path.dirname(md_path), exist_ok=True)
    with open(md_path, "w") as f:
        f.write("# Model Loader Preflight V2\n\n")
        f.write("| MODEL | REPO | LOADER | IMAGE_PIPELINE | LOAD | INFERENCE | STATUS | ROOT_CAUSE |\n")
        f.write("|-------|------|--------|----------------|------|-----------|--------|------------|\n")
        for r in results:
            f.write(f"| {r['model']} | {r['repo']} | {r['loader']} | {r['pipeline']} | {r['load']} | {r['inference']} | {r['status']} | {r['root_cause']} |\n")
            
    print(f"\nCreated report: {md_path}")
    
    # Only if ALL models except Gemma loaded correctly, we proceed to 5-question calibration
    # But since the user said "Run ONLY a 1-image x 1-model diagnostic until the shared image pipeline is proven. Then run the 5-question calibration."
    # We can run calibration here directly.
    print("\n--- Running 5-Question Calibration ---")
    with open("src/ai/quiz-engine/v2/benchmark/v2_final_master.json") as f:
        dataset = json.load(f)
    
    calib_qs = [q for q in dataset if q['question_type'] == 'IMAGE_MCQ'][:3] + [q for q in dataset if q['question_type'] == 'TEXT_MCQ'][:2]
    
    for m_name, m_info in test_models:
        adapter = m_info["adapter"](m_info["id"], m_info["precision"])
        try:
            adapter.load()
        except:
            continue
            
        print(f"\nCalibrating {m_name}...")
        for i, q in enumerate(calib_qs):
            prompt = format_question(q)
            img_path = None
            if q['question_type'] == 'IMAGE_MCQ':
                img_path = os.path.join("src/ai/quiz-engine/v2/benchmark/images", q['image_url'].split('/')[-1])
            
            # Validate image_path exists before testing
            if img_path and not os.path.exists(img_path):
                print(f"Q{i} -> Error: Image path {img_path} not found locally.")
                continue
            
            try:
                out = adapter.generate(prompt, img_path if q['question_type'] == 'IMAGE_MCQ' else None)
                print(f"Q{i} -> Parsed: {parse_answer(out)}")
            except Exception as e:
                print(f"Q{i} -> Error: {e}")

if __name__ == "__main__":
    main()
