import argparse
import sys
import torch
from PIL import Image

def run_qwen3(model_id, prompt_text, image_path):
    from transformers import AutoProcessor, AutoModelForImageTextToText
    processor = AutoProcessor.from_pretrained(model_id, trust_remote_code=True)
    model = AutoModelForImageTextToText.from_pretrained(
        model_id,
        torch_dtype=torch.bfloat16,
        device_map="auto",
        trust_remote_code=True
    ).eval()
    
    messages = [{"role": "user", "content": []}]
    if image_path:
        messages[0]["content"].append({"type": "image"})
    messages[0]["content"].append({"type": "text", "text": prompt_text})
    
    prompt = processor.apply_chat_template(messages, add_generation_prompt=True)
    img_obj = Image.open(image_path).convert("RGB") if image_path else None
    
    inputs = processor(text=prompt, images=[img_obj] if img_obj else None, return_tensors="pt").to(model.device)
    with torch.no_grad():
        generated_ids = model.generate(**inputs, max_new_tokens=10, do_sample=False)
    generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
    return processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]

def run_internvl(model_id, prompt_text, image_path):
    import torchvision.transforms as T
    from transformers import AutoTokenizer, AutoModel
    
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True, use_fast=False)
    model = AutoModel.from_pretrained(
        model_id,
        torch_dtype=torch.bfloat16,
        device_map="auto",
        trust_remote_code=True
    ).eval()

    if image_path:
        # InternVL requires specific image preprocessing
        IMAGENET_MEAN = (0.485, 0.456, 0.406)
        IMAGENET_STD = (0.229, 0.224, 0.225)
        transform = T.Compose([
            T.Lambda(lambda img: img.convert('RGB') if img.mode != 'RGB' else img),
            T.Resize((448, 448)),
            T.ToTensor(),
            T.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD)
        ])
        image = Image.open(image_path).convert('RGB')
        pixel_values = transform(image).unsqueeze(0).to(torch.bfloat16).to(model.device)
        generation_config = dict(max_new_tokens=10, do_sample=False)
        return model.chat(tokenizer, pixel_values, prompt_text, generation_config)
    else:
        generation_config = dict(max_new_tokens=10, do_sample=False)
        return model.chat(tokenizer, None, prompt_text, generation_config)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model_id", required=True)
    parser.add_argument("--prompt", required=True)
    parser.add_argument("--image_path", default=None)
    parser.add_argument("--adapter", required=True, choices=["qwen3", "internvl"])
    args = parser.parse_args()
    
    try:
        if args.adapter == "qwen3":
            out = run_qwen3(args.model_id, args.prompt, args.image_path)
        else:
            out = run_internvl(args.model_id, args.prompt, args.image_path)
            
        # Print output wrapped in markers to easily parse from stdout
        print(f"[[[ISOLATED_OUT_START]]]{out}[[[ISOLATED_OUT_END]]]")
    except Exception as e:
        print(f"[[[ISOLATED_ERROR_START]]]{str(e)}[[[ISOLATED_ERROR_END]]]")
        sys.exit(1)
