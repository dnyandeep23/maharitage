import os
import sys
import json
import time
import argparse
import traceback
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

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--adapter-path", type=str, required=True, help="Path to the LoRA adapter (e.g., checkpoints/final_adapter)")
    parser.add_argument("--base-model-id", type=str, default="Qwen/Qwen2.5-VL-3B-Instruct")
    args = parser.parse_args()

    print(f"Loading base model: {args.base_model_id}")
    processor = AutoProcessor.from_pretrained(args.base_model_id)
    
    device_map = "auto"
    torch_dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32

    base_model = AutoModelForCausalLM.from_pretrained(
        args.base_model_id,
        device_map=device_map,
        torch_dtype=torch_dtype
    )

    print(f"Loading LoRA adapter from: {args.adapter_path}")
    model = PeftModel.from_pretrained(base_model, args.adapter_path)
    model.eval()

    test_data = load_test_dataset()
    print(f"Loaded {len(test_data)} test examples.")

    results = {}
    correct = 0
    total = len(test_data)
    
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
                    image_path = c['image']
                    break
        
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
                continue
        else:
            messages.append({
                "role": "user",
                "content": [{"type": "text", "text": question_text}]
            })
            prompt = processor.apply_chat_template(messages, add_generation_prompt=True)
            inputs = processor(text=prompt, return_tensors="pt").to(model.device)

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
            print(f"[{i+1}/{total}] {ann_id}: ERROR: {e}")

    accuracy = (correct / total) * 100 if total > 0 else 0
    print(f"\nFinal Test Evaluation Accuracy: {accuracy:.2f}% ({correct}/{total})")
    
    os.makedirs(os.path.join(os.path.dirname(__file__), 'evaluation'), exist_ok=True)
    report_path = os.path.join(os.path.dirname(__file__), 'evaluation', 'test_results.json')
    with open(report_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Saved evaluation results to {report_path}")

if __name__ == "__main__":
    main()
