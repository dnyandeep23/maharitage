import os
import sys
import json
import time
import argparse
from PIL import Image
import torch
from transformers import AutoProcessor, AutoModelForCausalLM
from peft import PeftModel

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'scripts')))
from benchmark_core.prompt import format_question
from benchmark_core.parser import parse_answer

def load_test_dataset():
    test_file = os.path.join(os.path.dirname(__file__), 'data', 'test.jsonl')
    with open(test_file, 'r') as f:
        return [json.loads(line) for line in f]

def evaluate_model(model, processor, test_data, prefix=""):
    results = {}
    correct = 0
    total = len(test_data)
    
    img_correct, img_total = 0, 0
    txt_correct, txt_total = 0, 0
    invalid = 0
    start_all = time.time()
    
    for i, item in enumerate(test_data):
        ann_id = item['annotation_id']
        question_text = format_question(item)
        messages = []
        
        has_image = False
        image_path = None
        for m in item['messages']:
            for c in m['content']:
                if c['type'] == 'image':
                    has_image = True
                    break
        
        # We need the original image path to read the image. We can get it from item['images'] if it exists.
        if "images" in item and item["images"] and len(item["images"]) > 0:
            has_image = True
            image_path = item["images"][0]
            
        if has_image and image_path and os.path.exists(image_path):
            messages.append({
                "role": "user",
                "content": [
                    {"type": "image"},
                    {"type": "text", "text": question_text}
                ]
            })
            try:
                image = Image.open(image_path).convert("RGB")
                prompt = processor.apply_chat_template(messages, add_generation_prompt=True)
                inputs = processor(text=prompt, images=[image], return_tensors="pt").to(model.device)
            except Exception as e:
                print(f"Failed to process image {image_path}: {e}")
                results[ann_id] = {"parsed": "INVALID", "error": str(e), "correct": False}
                invalid += 1
                img_total += 1
                continue
            is_img = True
        else:
            messages.append({
                "role": "user",
                "content": [{"type": "text", "text": question_text}]
            })
            prompt = processor.apply_chat_template(messages, add_generation_prompt=True)
            inputs = processor(text=prompt, return_tensors="pt").to(model.device)
            is_img = False

        start_t = time.time()
        try:
            with torch.no_grad():
                generated_ids = model.generate(**inputs, max_new_tokens=10, do_sample=False)
                
            generated_ids_trimmed = [
                out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            output_text = processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]
            
            parsed = parse_answer(output_text)
            is_correct = (parsed == item['answer'])
            if is_correct:
                correct += 1
                if is_img: img_correct += 1
                else: txt_correct += 1
            if parsed == "INVALID":
                invalid += 1
                
            if is_img: img_total += 1
            else: txt_total += 1
                
            results[ann_id] = {
                "raw": output_text,
                "parsed": parsed,
                "latency": time.time() - start_t,
                "correct": is_correct,
                "error": None
            }
            print(f"[{i+1}/{total}] {ann_id}: {parsed} (Correct: {item['answer']}) - {'PASS' if is_correct else 'FAIL'}")
        except Exception as e:
            results[ann_id] = {
                "raw": "",
                "parsed": "INVALID",
                "latency": time.time() - start_t,
                "correct": False,
                "error": str(e)
            }
            invalid += 1
            if is_img: img_total += 1
            else: txt_total += 1
            print(f"[{i+1}/{total}] {ann_id}: ERROR: {e}")

    accuracy = (correct / total) * 100 if total > 0 else 0
    img_acc = (img_correct / img_total) * 100 if img_total > 0 else 0
    txt_acc = (txt_correct / txt_total) * 100 if txt_total > 0 else 0
    invalid_rate = (invalid / total) * 100 if total > 0 else 0
    avg_latency = (time.time() - start_all) / total if total > 0 else 0
    
    metrics = {
        "overall": accuracy,
        "text": txt_acc,
        "image": img_acc,
        "invalid": invalid_rate,
        "latency": avg_latency
    }
    
    print(f"\n{prefix} Accuracy: {accuracy:.2f}% ({correct}/{total})")
    
    return results, metrics

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--adapter-path", type=str, required=True, help="Path to the LoRA adapter")
    parser.add_argument("--base-model-id", type=str, default="Qwen/Qwen2.5-VL-3B-Instruct")
    args = parser.parse_args()

    print(f"Loading base model: {args.base_model_id}")
    processor = AutoProcessor.from_pretrained(args.base_model_id)
    
    device_map = "auto"
    torch_dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32

    from transformers import Qwen2_5_VLForConditionalGeneration
    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        args.base_model_id,
        device_map=device_map,
        torch_dtype=torch_dtype
    )
    model.eval()

    test_data = load_test_dataset()
    print(f"Loaded {len(test_data)} test examples.")

    print("\n--- Evaluating Base Model ---")
    base_results, base_metrics = evaluate_model(model, processor, test_data, prefix="Base Model")
    
    os.makedirs(os.path.join(os.path.dirname(__file__), 'evaluation'), exist_ok=True)
    with open(os.path.join(os.path.dirname(__file__), 'evaluation', 'base_qwen25_results.json'), "w") as f:
        json.dump(base_results, f, indent=2)

    print(f"\nLoading LoRA adapter from: {args.adapter_path}")
    model = PeftModel.from_pretrained(model, args.adapter_path)
    model.eval()

    print("\n--- Evaluating Finetuned Model ---")
    finetuned_results, finetuned_metrics = evaluate_model(model, processor, test_data, prefix="Finetuned Model")
    
    with open(os.path.join(os.path.dirname(__file__), 'evaluation', 'finetuned_qwen25_lora_results.json'), "w") as f:
        json.dump(finetuned_results, f, indent=2)
        
    print("\n=======================================================")
    print("COMPARISON ARTIFACT")
    print("=======================================================")
    print(f"{'Model':<20} | {'Method':<10} | {'Overall':<7} | {'Text':<7} | {'Image':<7} | {'Invalid':<7} | {'Latency':<7}")
    print("-" * 80)
    print(f"{'Base':<20} | {'Zero-Shot':<10} | {base_metrics['overall']:>6.1f}% | {base_metrics['text']:>6.1f}% | {base_metrics['image']:>6.1f}% | {base_metrics['invalid']:>6.1f}% | {base_metrics['latency']:>5.2f}s")
    print(f"{'Finetuned':<20} | {'LoRA':<10} | {finetuned_metrics['overall']:>6.1f}% | {finetuned_metrics['text']:>6.1f}% | {finetuned_metrics['image']:>6.1f}% | {finetuned_metrics['invalid']:>6.1f}% | {finetuned_metrics['latency']:>5.2f}s")
    print("=======================================================\n")

if __name__ == "__main__":
    main()
