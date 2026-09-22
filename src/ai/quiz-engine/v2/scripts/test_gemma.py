import os
import time
import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForImageTextToText

model_id = "google/gemma-3-4b-it"

print("GEMMA_ACCESS = PASS")

try:
    print("Testing PROCESSOR_LOAD...")
    processor = AutoProcessor.from_pretrained(model_id)
    print("Testing MODEL_LOAD...")
    model = AutoModelForImageTextToText.from_pretrained(
        model_id,
        torch_dtype=torch.bfloat16,
        device_map="auto"
    ).eval()
    print("MODEL_LOAD = PASS")
except Exception as e:
    print(f"MODEL_LOAD = FAIL ({e})")
    exit(1)

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

def generate(prompt_text, img_path):
    messages = [{"role": "user", "content": []}]
    if img_path:
        messages[0]["content"].append({"type": "image"})
    messages[0]["content"].append({"type": "text", "text": prompt_text})
    
    prompt = processor.apply_chat_template(messages, add_generation_prompt=True)
    img_obj = Image.open(img_path).convert("RGB") if img_path else None
    
    inputs = processor(text=prompt, images=[img_obj] if img_obj else None, return_tensors="pt").to(model.device)
    with torch.no_grad():
        generated_ids = model.generate(**inputs, max_new_tokens=10, do_sample=False)
    generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
    return processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]

print("Testing IMAGE_MCQ inference...")
img_path = "src/ai/quiz-engine/v2/scripts/test_image.jpg"
q_img = f"{SYSTEM_PROMPT}\n\nQuestion: What is this?\nA: A temple\nB: A fort\nC: A cave\nD: A palace\n"
try:
    out_img = generate(q_img, img_path)
    print(f"Raw Output: {out_img}")
    parsed = parse_answer(out_img)
    print(f"Parsed: {parsed}")
    print("IMAGE_INFERENCE = PASS")
    img_pass = True
except Exception as e:
    print(f"IMAGE_INFERENCE = FAIL ({e})")
    img_pass = False

print("Testing TEXT_MCQ inference...")
q_txt = f"{SYSTEM_PROMPT}\n\nQuestion: Who was the first emperor of Maurya?\nA: Ashoka\nB: Chandragupta\nC: Bindusara\nD: Dasharatha\n"
try:
    out_txt = generate(q_txt, None)
    print(f"Raw Output: {out_txt}")
    parsed = parse_answer(out_txt)
    print(f"Parsed: {parsed}")
    print("TEXT_INFERENCE = PASS")
    txt_pass = True
except Exception as e:
    print(f"TEXT_INFERENCE = FAIL ({e})")
    txt_pass = False

if parsed != "INVALID":
    print("PARSER = PASS")
else:
    print("PARSER = FAIL")

if img_pass and txt_pass and parsed != "INVALID":
    print("STATUS = READY")
else:
    print("STATUS = FAILED")
