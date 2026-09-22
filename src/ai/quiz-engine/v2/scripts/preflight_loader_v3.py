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

def main():
    prompt_text = "Who is the ruler?\nA: Gupta\nB: Maurya\nC: Vakataka\nD: Satavahana"
    results = []
    
    # Reload image freshly for safety
    base_img = Image.open(FIXTURE_PATH).convert("RGB")
    
    for m_name, m_info in MODELS.items():
        print(f"\n--- Evaluating {m_name} ---")
        adapter = m_info["adapter"](m_info["id"], m_info["precision"])
        load_status = "OK"
        inference_status = "OK"
        output_txt = ""
        status = "READY"
        root_cause = ""
        
        try:
            adapter.load()
        except Exception as e:
            load_status = "FAILED"
            inference_status = "SKIPPED"
            status = "LOAD_FAILED"
            root_cause = str(e)
            print(f"Load failed: {e}")
            
        if load_status == "OK":
            try:
                # MLX adapter expects string path, transformers expect PIL Image
                if "MLX" in m_name:
                    output_txt = adapter.generate(prompt_text, FIXTURE_PATH)
                else:
                    output_txt = adapter.generate(prompt_text, base_img)
                print(f"Raw Output: {output_txt}")
            except Exception as e:
                inference_status = "FAILED"
                status = "RUNTIME_FAILED"
                root_cause = str(e)
                print(f"Inference failed: {e}")
                
        results.append({
            "model": m_name, "load": load_status, "inference": inference_status,
            "output": output_txt.replace("\n", " ").strip() if output_txt else "", 
            "status": status, "root_cause": root_cause.replace("\n", " ")
        })
        
    md_path = "src/ai/quiz-engine/v2/reports/model_loader_preflight_v3.md"
    os.makedirs(os.path.dirname(md_path), exist_ok=True)
    with open(md_path, "w") as f:
        f.write("# Model Loader Preflight V3\n\n")
        f.write("| MODEL | LOAD | IMAGE_INPUT | INFERENCE | RAW_OUTPUT | STATUS | ROOT_CAUSE_IF_FAILED |\n")
        f.write("|-------|------|-------------|-----------|------------|--------|----------------------|\n")
        for r in results:
            img_in = "LOCAL_PATH" if "MLX" in r['model'] else "PIL_IMAGE"
            out_tr = (r['output'][:50] + '...') if len(r['output']) > 50 else r['output']
            f.write(f"| {r['model']} | {r['load']} | {img_in} | {r['inference']} | {out_tr} | {r['status']} | {r['root_cause']} |\n")
            
    print(f"\nCreated report: {md_path}")

if __name__ == "__main__":
    main()
