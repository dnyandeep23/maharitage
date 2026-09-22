import os
import torch
import torchvision.transforms as T
from PIL import Image
from transformers import AutoTokenizer, AutoModel

model_id = "OpenGVLab/InternVL3-2B"

print("Checking device...")
device = "mps" if torch.backends.mps.is_available() else "cpu"
print(f"Initial Target Device: {device}")

try:
    print("Testing PROCESSOR_LOAD...")
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True, use_fast=False)
    print("Testing MODEL_LOAD...")
    model = AutoModel.from_pretrained(
        model_id,
        torch_dtype=torch.bfloat16,
        trust_remote_code=True
    ).eval()
    
    try:
        model = model.to(device)
    except Exception as e:
        print(f"Failed to move to {device}: {e}, falling back to CPU")
        device = "cpu"
        model = model.to(device)
        
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
    generation_config = dict(max_new_tokens=10, do_sample=False)
    
    if img_path:
        IMAGENET_MEAN = (0.485, 0.456, 0.406)
        IMAGENET_STD = (0.229, 0.224, 0.225)
        transform = T.Compose([
            T.Lambda(lambda img: img.convert('RGB') if img.mode != 'RGB' else img),
            T.Resize((448, 448)),
            T.ToTensor(),
            T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
        ])
        image = Image.open(img_path).convert('RGB')
        pixel_values = transform(image).unsqueeze(0).to(torch.bfloat16).to(model.device)
        return model.chat(tokenizer, pixel_values, prompt_text, generation_config)
    else:
        return model.chat(tokenizer, None, prompt_text, generation_config)

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
    if device == "cpu":
        print("STATUS = READY_CPU")
    else:
        print("STATUS = READY")
else:
    print("STATUS = FAILED")
