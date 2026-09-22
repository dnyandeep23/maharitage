import torch
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

class IsolatedModelAdapter(ModelAdapter):
    def __init__(self, model_id, precision, adapter_type, python_env=".venv/bin/python"):
        super().__init__(model_id, precision)
        self.adapter_type = adapter_type
        self.python_env = python_env

    def load(self):
        pass # Lazy loading handled in generate

    def generate(self, prompt_text, image):
        import subprocess
        image_path = getattr(image, "filename", "") if hasattr(image, "filename") else ""
        if hasattr(image, 'fp') and hasattr(image.fp, 'name'):
            image_path = image.fp.name
            
        cmd = [
            self.python_env, "src/ai/quiz-engine/v2/scripts/run_isolated.py",
            "--model_id", self.model_id,
            "--prompt", prompt_text,
            "--adapter", self.adapter_type
        ]
        if image_path:
            cmd.extend(["--image_path", image_path])
            
        res = subprocess.run(cmd, capture_output=True, text=True)
        out = res.stdout
        err = res.stderr
        
        if "[[[ISOLATED_ERROR_START]]]" in out:
            err_msg = out.split("[[[ISOLATED_ERROR_START]]]")[-1].split("[[[ISOLATED_ERROR_END]]]")[0]
            raise RuntimeError(f"Isolated Error: {err_msg}")
        
        if "[[[ISOLATED_OUT_START]]]" in out:
            return out.split("[[[ISOLATED_OUT_START]]]")[-1].split("[[[ISOLATED_OUT_END]]]")[0]
            
        raise RuntimeError(f"Isolation subprocess failed: {err}\nSTDOUT: {out}")

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
        messages = [{"role": "user", "content": []}]
        if image: messages[0]["content"].append({"type": "image"})
        messages[0]["content"].append({"type": "text", "text": prompt_text})
        
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        inputs = self.processor(text=prompt, images=[image] if image else None, return_tensors="pt").to(self.model.device)
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
        messages = [{"role": "user", "content": []}]
        if image: messages[0]["content"].append({"type": "image"})
        messages[0]["content"].append({"type": "text", "text": prompt_text})
        
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        inputs = self.processor(text=prompt, images=[image] if image else None, return_tensors="pt").to(self.model.device)
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
        messages = [{"role": "user", "content": []}]
        if image: messages[0]["content"].append({"type": "image"})
        messages[0]["content"].append({"type": "text", "text": prompt_text})
        
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        inputs = self.processor(text=prompt, images=[image] if image else None, return_tensors="pt").to(self.model.device)
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
        messages = [{"role": "user", "content": []}]
        if image: messages[0]["content"].append({"type": "image"})
        messages[0]["content"].append({"type": "text", "text": prompt_text})
        
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        inputs = self.processor(text=prompt, images=[image] if image else None, return_tensors="pt").to(self.model.device)
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

    def generate(self, prompt_text, image):
        messages = [{"role": "user", "content": []}]
        if image: messages[0]["content"].append({"type": "image"})
        messages[0]["content"].append({"type": "text", "text": prompt_text})
        
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        inputs = self.processor(text=prompt, images=[image] if image else None, return_tensors="pt").to(self.model.device)
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

    def generate(self, prompt_text, image):
        pass 

class QwenMLXAdapter(ModelAdapter):
    def load(self):
        from mlx_vlm import load
        self.model, self.processor = load(self.model_id)

    def generate(self, prompt_text, image_path): 
        from mlx_vlm import generate
        messages = [{"role": "user", "content": []}]
        if image_path:
            messages[0]["content"].append({"type": "image"})
        messages[0]["content"].append({"type": "text", "text": prompt_text})
        prompt = self.processor.apply_chat_template(messages, add_generation_prompt=True)
        
        if image_path:
            res = generate(self.model, self.processor, prompt, [image_path], verbose=False, max_tokens=10, temp=0.0)
        else:
            res = generate(self.model, self.processor, prompt, verbose=False, max_tokens=10, temp=0.0)
            
        if hasattr(res, 'text'):
            return res.text
        return str(res)

def Qwen3IsolatedAdapter(model_id, precision):
    return IsolatedModelAdapter(model_id, precision, "qwen3", ".venv/bin/python")

def InternVLIsolatedAdapter(model_id, precision):
    return IsolatedModelAdapter(model_id, precision, "internvl", ".venv_internvl/bin/python")
