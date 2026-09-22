import json
import os
import time
import argparse
import hashlib
import traceback
import csv
from PIL import Image

# Force deterministic random where possible
import torch

try:
    import mlx.core as mx
    from mlx_vlm import load, generate
    MLX_AVAILABLE = True
except ImportError:
    MLX_AVAILABLE = False

from transformers import AutoProcessor, AutoModelForCausalLM
from transformers.image_utils import load_image

MODELS = {
    "SmolVLM-256M": {
        "id": "HuggingFaceTB/SmolVLM-256M-Instruct",
        "backend": "transformers",
        "precision": "bfloat16",
    },
    "SmolVLM-500M": {
        "id": "HuggingFaceTB/SmolVLM-500M-Instruct",
        "backend": "transformers",
        "precision": "bfloat16",
    },
    "llava-onevision-0.5b": {
        "id": "llava-hf/llava-onevision-qwen2-0.5b-ov-hf",
        "backend": "transformers",
        "precision": "float16",
    },
    "Qwen2-VL-2B-MLX": {
        "id": "mlx-community/Qwen2-VL-2B-Instruct-4bit",
        "backend": "mlx",
        "precision": "4-bit",
    },
    "Qwen3-VL-2B": {
        "id": "Qwen/Qwen3-VL-2B-Instruct",
        "backend": "transformers",
        "precision": "bfloat16",
        "trust_remote_code": True
    },
    "Qwen2.5-VL-3B": {
        "id": "Qwen/Qwen2.5-VL-3B-Instruct",
        "backend": "transformers",
        "precision": "bfloat16",
        "trust_remote_code": True
    },
    "Qwen3-VL-4B": {
        "id": "Qwen/Qwen3-VL-4B-Instruct",
        "backend": "transformers",
        "precision": "bfloat16",
        "trust_remote_code": True
    },
    "InternVL3-2B": {
        "id": "OpenGVLab/InternVL3-2B",
        "backend": "transformers",
        "precision": "bfloat16",
        "trust_remote_code": True
    },
    "gemma-3-4b-it": {
        "id": "google/gemma-3-4b-it",
        "backend": "transformers",
        "precision": "bfloat16",
    }
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
    if not text:
        return "INVALID"
    text = text.strip()
    # Find the last A, B, C, or D if it follows standard prefixes
    if text in ["A", "B", "C", "D"]:
        return text
    if "ANSWER: A" in text.upper(): return "A"
    if "ANSWER: B" in text.upper(): return "B"
    if "ANSWER: C" in text.upper(): return "C"
    if "ANSWER: D" in text.upper(): return "D"
    if "OPTION A" in text.upper(): return "A"
    if "OPTION B" in text.upper(): return "B"
    if "OPTION C" in text.upper(): return "C"
    if "OPTION D" in text.upper(): return "D"
    
    # If the response is literally just one letter after stripping whitespace
    parts = text.split()
    if len(parts) > 0 and parts[-1].upper() in ["A", "B", "C", "D"]:
        return parts[-1].upper()
    return "INVALID"

def format_question(q):
    prompt = f"{SYSTEM_PROMPT}\n\nQuestion: {q['question']}\n"
    for opt in ['A', 'B', 'C', 'D']:
        prompt += f"{opt}: {q['options'][opt]}\n"
    return prompt

class TransformersWrapper:
    def __init__(self, model_info):
        self.model_info = model_info
        self.model_id = model_info['id']
        kwargs = {}
        if model_info.get("precision") == "bfloat16":
            kwargs["torch_dtype"] = torch.bfloat16
        elif model_info.get("precision") == "float16":
            kwargs["torch_dtype"] = torch.float16
        if model_info.get("trust_remote_code"):
            kwargs["trust_remote_code"] = True
            
        self.processor = AutoProcessor.from_pretrained(self.model_id, trust_remote_code=kwargs.get("trust_remote_code", False))
        
        try:
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_id,
                device_map="auto",
                **kwargs
            )
        except Exception as e:
            if "Unrecognized configuration class" in str(e):
                from transformers import AutoModel
                self.model = AutoModel.from_pretrained(
                    self.model_id,
                    device_map="auto",
                    **kwargs
                )
            else:
                raise e
                
        self.model.eval()

    def generate(self, prompt_text, image_path=None):
        messages = []
        if image_path:
            messages.append({
                "role": "user",
                "content": [
                    {"type": "image"},
                    {"type": "text", "text": prompt_text}
                ]
            })
            image = Image.open(image_path).convert("RGB")
            prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
            inputs = self.processor(text=prompt, images=[image], return_tensors="pt").to(self.model.device)
        else:
            messages.append({
                "role": "user",
                "content": [{"type": "text", "text": prompt_text}]
            })
            prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
            inputs = self.processor(text=prompt, return_tensors="pt").to(self.model.device)

        with torch.no_grad():
            generated_ids = self.model.generate(**inputs, max_new_tokens=10, do_sample=False)
            
        generated_ids_trimmed = [
            out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
        ]
        output_text = self.processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]
        return output_text

class MLXWrapper:
    def __init__(self, model_info):
        self.model_info = model_info
        self.model_id = model_info['id']
        self.model, self.processor = load(self.model_id)

    def generate(self, prompt_text, image_path=None):
        if image_path:
            messages = [{"role": "user", "content": [{"type": "image"}, {"type": "text", "text": prompt_text}]}]
            prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
            output = generate(self.model, self.processor, prompt, [image_path], verbose=False, max_tokens=10, temp=0.0)
        else:
            messages = [{"role": "user", "content": [{"type": "text", "text": prompt_text}]}]
            prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
            output = generate(self.model, self.processor, prompt, verbose=False, max_tokens=10, temp=0.0)
        return output

def run_preflight(model_name, model_info, image_map, sample_question):
    print(f"\n--- Preflight: {model_name} ---")
    try:
        if model_info['backend'] == 'mlx':
            wrapper = MLXWrapper(model_info)
        else:
            wrapper = TransformersWrapper(model_info)
        
        prompt_text = format_question(sample_question)
        image_path = image_map.get(sample_question['image_id'])
        if not image_path or not os.path.exists(image_path):
            return "DOWNLOAD_FAILED"
        
        output = wrapper.generate(prompt_text, image_path)
        parsed = parse_answer(output)
        if parsed in ["A", "B", "C", "D"]:
            print(f"Preflight OK. Parsed: {parsed}")
            return "READY"
        else:
            print(f"Preflight Parsed Invalid: {parsed} from Output: {output}")
            return "RUNTIME_FAILED"
    except Exception as e:
        print(f"Preflight Error: {e}")
        traceback.print_exc()
        return "LOAD_FAILED"
        
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--only-calibrate", action="store_true")
    args = parser.parse_args()
    
    print("MAHARITAGE V2 - 9-MODEL FAIR BENCHMARK")
    image_map = build_image_map()
    with open("src/ai/quiz-engine/v2/benchmark/v2_final_master.json") as f:
        dataset = json.load(f)
        
    # Availability Preflight
    availability = {}
    sample_q = next(q for q in dataset if q['question_type'] == 'IMAGE_MCQ')
    
    print("\n[1] AVAILABILITY PREFLIGHT")
    for m_name, m_info in MODELS.items():
        status = run_preflight(m_name, m_info, image_map, sample_q)
        availability[m_name] = status
        
    os.makedirs("src/ai/quiz-engine/v2/reports", exist_ok=True)
    with open("src/ai/quiz-engine/v2/reports/final_9_model_availability.md", "w") as f:
        f.write("# Model Availability\n\n")
        for m, s in availability.items():
            f.write(f"- {m}: {s}\n")
            
    # Calibration
    print("\n[2] CALIBRATION")
    calib_qs = []
    img_qs = [q for q in dataset if q['question_type'] == 'IMAGE_MCQ'][:3]
    txt_qs = [q for q in dataset if q['question_type'] == 'TEXT_MCQ'][:2]
    calib_qs = img_qs + txt_qs
    
    for m_name, m_info in MODELS.items():
        if availability[m_name] != "READY": continue
        print(f"\nCalibrating {m_name}...")
        try:
            if m_info['backend'] == 'mlx': wrapper = MLXWrapper(m_info)
            else: wrapper = TransformersWrapper(m_info)
            for i, q in enumerate(calib_qs):
                prompt = format_question(q)
                img_path = image_map.get(q['image_id']) if q['image_id'] else None
                out = wrapper.generate(prompt, img_path)
                print(f"Q{i} -> Raw: {out.strip()} | Parsed: {parse_answer(out)}")
        except Exception as e:
            print(f"Calibration failed for {m_name}: {e}")
            
    if args.only_calibrate:
        print("\nCalibration finished. Stopping.")
        return
        
    print("\n[3] FULL BENCHMARK RUN")
    results_file = "src/ai/quiz-engine/v2/evaluation/final_9_model_results.json"
    os.makedirs(os.path.dirname(results_file), exist_ok=True)
    if os.path.exists(results_file):
        with open(results_file) as f:
            all_results = json.load(f)
    else:
        all_results = {}
        
    for m_name, m_info in MODELS.items():
        if availability[m_name] != "READY": continue
        if m_name not in all_results:
            all_results[m_name] = {}
            
        print(f"\nRunning Full Benchmark for {m_name}")
        wrapper = None
        
        for i, q in enumerate(dataset):
            ann_id = q['annotation_id']
            if ann_id in all_results[m_name]:
                continue
                
            if wrapper is None:
                if m_info['backend'] == 'mlx': wrapper = MLXWrapper(m_info)
                else: wrapper = TransformersWrapper(m_info)
                
            prompt = format_question(q)
            img_path = image_map.get(q['image_id']) if q['image_id'] else None
            
            start_t = time.time()
            try:
                out = wrapper.generate(prompt, img_path)
                latency = time.time() - start_t
                parsed = parse_answer(out)
                all_results[m_name][ann_id] = {
                    "raw": out,
                    "parsed": parsed,
                    "latency": latency,
                    "correct": parsed == q['answer'],
                    "error": None
                }
            except Exception as e:
                all_results[m_name][ann_id] = {
                    "raw": "",
                    "parsed": "INVALID",
                    "latency": time.time() - start_t,
                    "correct": False,
                    "error": str(e)
                }
                
            if i % 10 == 0:
                with open(results_file, "w") as f:
                    json.dump(all_results, f, indent=2)
                    
        with open(results_file, "w") as f:
            json.dump(all_results, f, indent=2)
                
if __name__ == "__main__":
    main()
