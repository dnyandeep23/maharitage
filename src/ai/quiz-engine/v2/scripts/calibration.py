import os
import json
import traceback
from PIL import Image
import torch

print("--- DIAGNOSTIC V3 ---")

FIXTURE_PATH = "src/ai/quiz-engine/v2/scripts/test_image.jpg"
if not os.path.exists(FIXTURE_PATH):
    raise RuntimeError(f"Fixture {FIXTURE_PATH} not found.")

print(f"Path: {FIXTURE_PATH}")
print(f"Exists: {os.path.exists(FIXTURE_PATH)}")
print(f"Size: {os.path.getsize(FIXTURE_PATH)} bytes")

try:
    img = Image.open(FIXTURE_PATH)
    img.load()
    print(f"Mode: {img.mode}")
    print(f"Format: {img.format}")
    print("PIL Image loaded successfully.")
except Exception as e:
    raise RuntimeError(f"Failed to load fixture with PIL: {e}")

from transformers import AutoProcessor

class ModelAdapter:
    def __init__(self, model_id, precision):
        self.model_id = model_id
        self.precision = precision
        self.processor = None
        self.model = None

    def load(self):
        raise NotImplementedError

    def generate(self, prompt_text, image):
        raise NotImplementedError


class SmolVLMAdapter(ModelAdapter):
    def load(self):
        from transformers import AutoModelForImageTextToText
        self.processor = AutoProcessor.from_pretrained(self.model_id)
        self.model = AutoModelForImageTextToText.from_pretrained(
            self.model_id,
            torch_dtype=torch.bfloat16 if self.precision == "bfloat16" else torch.float16,
            device_map="auto"
        ).eval()

    def generate(self, prompt_text, image):
        messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}]
        print(f"Diagnostics before processor:")
        print(f"  image type: {type(image)}")
        print(f"  image mode: {image.mode}")
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

    def generate(self, prompt_text, image):
        messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}]
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        inputs = self.processor(text=prompt, images=[image], return_tensors="pt").to(self.model.device)
        with torch.no_grad():
            generated_ids = self.model.generate(**inputs, max_new_tokens=10, do_sample=False)
        generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
        return self.processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]


class Qwen3_Adapter(ModelAdapter):
    def load(self):
        from transformers import AutoModelForImageTextToText
        self.processor = AutoProcessor.from_pretrained(self.model_id, trust_remote_code=True)
        self.model = AutoModelForImageTextToText.from_pretrained(
            self.model_id,
            torch_dtype=torch.bfloat16 if self.precision == "bfloat16" else torch.float16,
            device_map="auto",
            trust_remote_code=True
        ).eval()

    def generate(self, prompt_text, image):
        messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}]
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        inputs = self.processor(text=prompt, images=[image], return_tensors="pt").to(self.model.device)
        with torch.no_grad():
            generated_ids = self.model.generate(**inputs, max_new_tokens=10, do_sample=False)
        generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
        return self.processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]


class Qwen2_5_Adapter(ModelAdapter):
    def load(self):
        from transformers import Qwen2_5_VLForConditionalGeneration
        self.processor = AutoProcessor.from_pretrained(self.model_id)
        self.model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
            self.model_id,
            torch_dtype=torch.bfloat16 if self.precision == "bfloat16" else torch.float16,
            device_map="auto"
        ).eval()

    def generate(self, prompt_text, image):
        messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}]
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

    def generate(self, prompt_text, image_path): # Note MLX needs path, not PIL image
        from mlx_vlm import generate
        messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}]
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        res = generate(self.model, self.processor, prompt, [image_path], verbose=False, max_tokens=10, temp=0.0)
        if hasattr(res, 'text'):
            return res.text
        return str(res)


MODELS = {
    "SmolVLM-256M": {"id": "HuggingFaceTB/SmolVLM-256M-Instruct", "precision": "bfloat16", "adapter": SmolVLMAdapter},
    "llava-onevision-0.5b": {"id": "llava-hf/llava-onevision-qwen2-0.5b-ov-hf", "precision": "float16", "adapter": LlavaAdapter},
    "Qwen3-VL-2B": {"id": "Qwen/Qwen3-VL-2B-Instruct", "precision": "bfloat16", "adapter": Qwen3_Adapter},
    "Qwen2.5-VL-3B": {"id": "Qwen/Qwen2.5-VL-3B-Instruct", "precision": "bfloat16", "adapter": Qwen2_5_Adapter},
    "Qwen3-VL-4B": {"id": "Qwen/Qwen3-VL-4B-Instruct", "precision": "bfloat16", "adapter": Qwen3_Adapter},
    "Qwen2-VL-2B-MLX": {"id": "mlx-community/Qwen2-VL-2B-Instruct-4bit", "precision": "4-bit", "adapter": QwenMLXAdapter}
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

SYSTEM_PROMPT = "You are answering a multiple-choice Maharashtra heritage question.\n\nChoose exactly one option: A, B, C, or D.\n\nReturn only:\n\nANSWER: A"

def format_question(q):
    prompt = f"{SYSTEM_PROMPT}\n\nQuestion: {q['question']}\n"
    for opt in ['A', 'B', 'C', 'D']:
        prompt += f"{opt}: {q['options'][opt]}\n"
    return prompt

def main():
    import time
    print("--- Running 5-Question Calibration ---")
    
    with open("src/ai/quiz-engine/v2/benchmark/v2_final_master.json") as f:
        dataset = json.load(f)
    
    # 3 image, 2 text
    image_qs = [q for q in dataset if q['question_type'] == 'IMAGE_MCQ'][:3]
    text_qs = [q for q in dataset if q['question_type'] == 'TEXT_MCQ'][:2]
    calib_qs = image_qs + text_qs
    
    for m_name, m_info in MODELS.items():
        if m_name == "gemma-3-4b-it": continue
        if m_name == "InternVL3-2B": continue

        print(f"\n{'='*50}\nMODEL: {m_name}\n{'='*50}")
        adapter = m_info["adapter"](m_info["id"], m_info["precision"])
        try:
            adapter.load()
        except Exception as e:
            print(f"STATUS: LOAD_FAILED\nRoot Cause: {e}")
            continue
            
        valid = 0
        correct = 0
        latencies = []
        status = "PASS"
        
        for i, q in enumerate(calib_qs):
            prompt = format_question(q)
            img_path = None
            if q['question_type'] == 'IMAGE_MCQ':
                img_path = os.path.join("src/ai/quiz-engine/v2/benchmark/images", q['image_url'].split('/')[-1])
                if not os.path.exists(img_path):
                    print(f"Q{i} ERROR: {img_path} not found")
                    status = "FAIL"
                    continue
            
            try:
                t0 = time.time()
                if "MLX" in m_name:
                    out = adapter.generate(prompt, img_path) if img_path else adapter.generate(prompt, "")
                else:
                    if img_path:
                        img_obj = Image.open(img_path).convert("RGB")
                    else:
                        img_obj = Image.new('RGB', (10, 10), color = 'black') # Dummy for text-only
                    out = adapter.generate(prompt, img_obj)
                dt = time.time() - t0
                
                parsed = parse_answer(out)
                if parsed != "INVALID": valid += 1
                if parsed == q['answer']: correct += 1
                latencies.append(dt)
                print(f"Q{i} raw: {out.strip()} -> parsed: {parsed} (expected: {q['answer']}) [{dt:.2f}s]")
                
            except Exception as e:
                print(f"Q{i} ERROR: {e}")
                status = "RUNTIME_FAILED"
                break
                
        if status == "PASS":
            avg_lat = sum(latencies)/len(latencies) if latencies else 0
            acc = (correct / 5) * 100
            print(f"\nVALID_OUTPUTS: {valid}/5")
            print(f"INVALID_OUTPUTS: {5-valid}/5")
            print(f"CALIBRATION_ACCURACY: {acc}%")
            print(f"AVG_LATENCY: {avg_lat:.2f}s")
        print(f"STATUS: {status}")

if __name__ == "__main__":
    main()
