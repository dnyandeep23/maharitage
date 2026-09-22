#!/usr/bin/env python3
"""
SmolVLM + LoRA Visual Inference Microservice (Standard Library HTTP Server)
Exposes POST /predict and GET /health for fast single-instance visual question predictions.
Loads Base Model + LoRA Adapter strictly once at server startup.
"""

import os
import sys
import time
import json
import re
import urllib.request
import io
import threading
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from PIL import Image
import torch

# pyrefly: ignore [missing-import]
from transformers import AutoProcessor, SmolVLMForConditionalGeneration
# pyrefly: ignore [missing-import]
from peft import PeftModel

ROOT = Path(__file__).resolve().parents[5]
CHECKPOINTS_DIR = ROOT / "src/ai/quiz-engine/v1/training/checkpoints/smolvlm_lora_v1"
MODEL_ID = "HuggingFaceTB/SmolVLM-256M-Instruct"

device = torch.device("mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu"))
letters = ["A", "B", "C", "D"]
inference_lock = threading.Lock()

# Global model state
state = {
    "processor": None,
    "model": None,
    "model_id": MODEL_ID,
    "adapter": "smolvlm_lora_v1",
    "base_params": 0,
    "lora_params": 0,
    "ready": False
}

PROMPT_TEMPLATE = """Look at the image carefully and answer the multiple-choice question.

Question:
{question}

Options:
A. {opt0}
B. {opt1}
C. {opt2}
D. {opt3}

Return ONLY one character:
A
B
C
or D

Answer:"""

def parse_mcq_answer(text: str):
    if not text or not isinstance(text, str):
        return None
    clean_text = text.strip()
    if not clean_text:
        return None
        
    if clean_text.upper() in letters:
        return clean_text.upper()
        
    m_start = re.search(r'^([ABCD])(?:\.|\s|\n|$)', clean_text, re.IGNORECASE)
    if m_start:
        return m_start.group(1).upper()
        
    m_prefix = re.search(r'^(?:ANSWER|OPTION|CHOICE)\s*[:=-]?\s*([ABCD])(?:\.|\b)', clean_text, re.IGNORECASE)
    if m_prefix:
        return m_prefix.group(1).upper()
        
    m_phrase = re.search(r'(?:THE CORRECT ANSWER IS|THE ANSWER IS|OPTION|CHOICE)\s*([ABCD])(?:\b|\.|\s)', clean_text, re.IGNORECASE)
    if m_phrase:
        return m_phrase.group(1).upper()
        
    return None

def load_image_from_url(url: str):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            return Image.open(io.BytesIO(response.read())).convert('RGB')
    except Exception:
        return Image.new('RGB', (512, 512), color='grey')

def init_model():
    print("==================================================")
    print("LOADING VISUAL INFERENCE MODEL ONCE AT STARTUP")
    print(f"Project Root: {ROOT}")
    print(f"Device: {device}")
    print(f"Base Model: {MODEL_ID}")
    print(f"LoRA Checkpoint Dir: {CHECKPOINTS_DIR}")
    
    # Strict assertions on checkpoint path
    if not CHECKPOINTS_DIR.exists():
        raise RuntimeError(f"FATAL: LoRA Checkpoint directory missing: {CHECKPOINTS_DIR}")
        
    adapter_config_path = CHECKPOINTS_DIR / "adapter_config.json"
    if not adapter_config_path.exists():
        raise RuntimeError(f"FATAL: adapter_config.json missing at {adapter_config_path}")

    t0 = time.time()
    processor = AutoProcessor.from_pretrained(MODEL_ID)
    base_model = SmolVLMForConditionalGeneration.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float16 if device.type != "cpu" else torch.float32,
        low_cpu_mem_usage=True
    ).to(device)
    
    base_params = sum(p.numel() for p in base_model.parameters())
    print(f"Base Model Parameters: {base_params}")
    
    print(f"Loading LoRA Adapter from {CHECKPOINTS_DIR}...")
    lora_model = PeftModel.from_pretrained(base_model, CHECKPOINTS_DIR).to(device)
    lora_model.eval()
    
    lora_params = sum(p.numel() for n, p in lora_model.named_parameters() if "lora" in n.lower())
    if lora_params == 0:
        raise RuntimeError("FATAL: Failed to load LoRA adapter parameters (param count = 0)")
        
    print(f"LoRA Adapter Parameters Loaded: {lora_params}")
    print("ADAPTER LOADED SUCCESSFULLY: YES")
        
    state["processor"] = processor
    state["model"] = lora_model
    state["base_params"] = base_params
    state["lora_params"] = lora_params
    state["adapter"] = "smolvlm_lora_v1"
    state["ready"] = True
    print(f"Model & Adapter ready in memory in {time.time() - t0:.2f}s!")
    print("==================================================")

class InferenceHTTPServer(HTTPServer):
    allow_reuse_address = True

class InferenceHTTPHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            peak_mem = 0.0
            if device.type == "mps" and hasattr(torch.mps, "driver_allocated_memory"):
                peak_mem = round(torch.mps.driver_allocated_memory() / (1024**3), 2)
                
            self._send_json({
                "status": "healthy" if state["ready"] else "loading",
                "model": state["model_id"],
                "adapter": state["adapter"],
                "base_parameters": state["base_params"],
                "lora_parameters": state["lora_params"],
                "device": str(device),
                "peak_memory_gib": peak_mem
            })
        else:
            self._send_json({"error": "Not Found"}, 404)

    def do_POST(self):
        if self.path != "/predict":
            self._send_json({"error": "Not Found"}, 404)
            return

        if not state["ready"]:
            self._send_json({"prediction": None, "error": "Model loading"}, 503)
            return

        try:
            content_len = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_len)
            req_data = json.loads(post_body.decode('utf-8'))
            
            question = req_data.get("question", "")
            opts = req_data.get("options", [])
            image_url = req_data.get("imageUrl", "")
            
            if not question or not opts or len(opts) < 4 or not image_url:
                self._send_json({"prediction": None, "error": "Invalid request payload"}, 400)
                return

            start_t = time.time()
            image = load_image_from_url(image_url)
            prompt_text = PROMPT_TEMPLATE.format(
                question=question,
                opt0=opts[0],
                opt1=opts[1],
                opt2=opts[2],
                opt3=opts[3]
            )

            processor = state["processor"]
            model = state["model"]

            with inference_lock:
                inputs = processor(text=f"<image>\n{prompt_text}", images=image, return_tensors="pt", do_image_splitting=False).to(device)
                if device.type != "cpu" and "pixel_values" in inputs:
                    inputs["pixel_values"] = inputs["pixel_values"].to(torch.float16)

                with torch.no_grad():
                    input_len = inputs["input_ids"].shape[1]
                    generated_ids = model.generate(**inputs, max_new_tokens=5, do_sample=False)
                    generated_tokens = generated_ids[:, input_len:]
                    raw_output = processor.batch_decode(generated_tokens, skip_special_tokens=True)[0].strip()

            prediction = parse_mcq_answer(raw_output)
            latency = int(round((time.time() - start_t) * 1000))

            self._send_json({
                "prediction": prediction,
                "confidence": None,
                "model": state["model_id"],
                "adapter": state["adapter"],
                "latencyMs": latency
            })
        except Exception as e:
            self._send_json({"prediction": None, "error": str(e)}, 500)

    def log_message(self, format, *args):
        # Suppress default noisy access logs
        return

def run_server(port=8000):
    init_model()
    server_address = ('127.0.0.1', port)
    httpd = InferenceHTTPServer(server_address, InferenceHTTPHandler)
    print(f"Visual Inference Service listening on http://127.0.0.1:{port}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server.")
        httpd.server_close()

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
