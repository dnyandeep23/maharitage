import time
import torch
from PIL import Image
from transformers import AutoProcessor, AutoModelForImageTextToText

model_id = "Qwen/Qwen3-VL-2B-Instruct"
print(f"Loading {model_id} in isolation...")

processor = AutoProcessor.from_pretrained(model_id, trust_remote_code=True)
model = AutoModelForImageTextToText.from_pretrained(
    model_id,
    torch_dtype=torch.bfloat16,
    device_map="auto",
    trust_remote_code=True
).eval()

print("Model loaded successfully.")

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

# Test Image
print("Testing IMAGE_MCQ...")
img_path = "src/ai/quiz-engine/v2/scripts/test_image.jpg"
out_img = generate("What is this?", img_path)
print("IMAGE OUTPUT:", out_img)

# Test Text
print("Testing TEXT_MCQ...")
out_txt = generate("Who was the first emperor of Maurya?", None)
print("TEXT OUTPUT:", out_txt)
