import os
import sys
import json
import time
import argparse
from PIL import Image
import torch
from peft import PeftModel

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'scripts')))
from benchmark_core.parser import parse_answer

# --- Paths ---
V2_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MASTER_JSON = os.path.join(V2_DIR, 'benchmark', 'v2.0.1_master.json')
TEST_SPLIT_JSON = os.path.join(V2_DIR, 'dataset', 'splits', 'test.json')
TEST_JSONL = os.path.join(os.path.dirname(__file__), 'data', 'test.jsonl')

# Image resolution limits (must match training)
MIN_PIXELS = 256 * 28 * 28
MAX_PIXELS = 1024 * 28 * 28


def extract_question_text(jsonl_item):
    """Extract user question text from VLM conversational messages."""
    for msg in jsonl_item['messages']:
        if msg['role'] == 'user':
            for c in msg['content']:
                if c['type'] == 'text':
                    return c['text']
    return ''


def extract_answer_text(jsonl_item):
    """Extract assistant answer letter from VLM conversational messages."""
    for msg in jsonl_item['messages']:
        if msg['role'] == 'assistant':
            for c in msg['content']:
                if c['type'] == 'text':
                    text = c['text']
                    if 'ANSWER:' in text:
                        return text.split('ANSWER:')[1].strip()
    return ''


def build_test_mapping():
    """Build a verified mapping between test JSONL items and frozen master records.
    
    Returns list of dicts with keys: jsonl_item, annotation_id, correct_answer,
    question_type, has_image, image_path.
    """
    # Load frozen authoritative sources
    with open(MASTER_JSON, 'r') as f:
        master = json.load(f)
    with open(TEST_SPLIT_JSON, 'r') as f:
        test_split = json.load(f)
    with open(TEST_JSONL, 'r') as f:
        test_jsonl = [json.loads(line) for line in f]

    test_ann_ids = set(test_split['annotation_ids'])
    master_by_id = {item['annotation_id']: item for item in master}

    # Verify all test split IDs exist in master
    missing_from_master = test_ann_ids - set(master_by_id.keys())
    assert len(missing_from_master) == 0, f"Test IDs missing from master: {missing_from_master}"
    assert len(test_jsonl) == 54, f"Expected 54 test JSONL examples, got {len(test_jsonl)}"

    # Match JSONL items to master records via question text + answer
    used_ids = set()
    mapped = []

    for i, jitem in enumerate(test_jsonl):
        q_text = extract_question_text(jitem)
        ans_text = extract_answer_text(jitem)

        found_id = None
        for mid in test_ann_ids:
            if mid in used_ids:
                continue
            mitem = master_by_id[mid]
            if mitem['question'] in q_text and mitem['answer'] == ans_text:
                found_id = mid
                break

        assert found_id is not None, (
            f"JSONL[{i}] unmatched! answer={ans_text}, question={q_text[:80]}..."
        )
        used_ids.add(found_id)

        # Determine image info from JSONL
        images = jitem.get('images', [])
        has_image = len(images) > 0 and images[0] is not None
        image_path = images[0] if has_image else None

        mapped.append({
            'jsonl_item': jitem,
            'annotation_id': found_id,
            'correct_answer': master_by_id[found_id]['answer'],
            'question_type': master_by_id[found_id].get('question_type', 'unknown'),
            'has_image': has_image,
            'image_path': image_path,
        })

    # Final integrity checks
    mapped_ids = {m['annotation_id'] for m in mapped}
    assert len(mapped_ids) == 54, f"Expected 54 unique IDs, got {len(mapped_ids)}"
    assert mapped_ids == test_ann_ids, "Mapped IDs don't match frozen test split!"

    return mapped


def evaluate_model(model, processor, test_mapping, prefix=""):
    """Evaluate model on the mapped test set."""
    results = {}
    correct = 0
    total = len(test_mapping)

    img_correct, img_total = 0, 0
    txt_correct, txt_total = 0, 0
    invalid = 0
    start_all = time.time()

    for i, item in enumerate(test_mapping):
        ann_id = item['annotation_id']
        correct_answer = item['correct_answer']
        has_image = item['has_image']
        image_path = item['image_path']

        # Build messages from JSONL (same format as training)
        jsonl_messages = item['jsonl_item']['messages']
        # Use only the user turn for inference (drop assistant turn)
        user_msg = None
        for msg in jsonl_messages:
            if msg['role'] == 'user':
                user_msg = msg
                break

        assert user_msg is not None, f"No user message in JSONL for {ann_id}"
        messages = [user_msg]

        if has_image and image_path and os.path.exists(image_path):
            try:
                image = Image.open(image_path).convert("RGB")
                prompt = processor.apply_chat_template(messages, add_generation_prompt=True)
                inputs = processor(text=prompt, images=[image], return_tensors="pt").to(model.device)
            except Exception as e:
                print(f"[{i+1}/{total}] {ann_id}: IMAGE ERROR: {e}")
                results[ann_id] = {
                    "parsed": "INVALID", "correct_answer": correct_answer,
                    "correct": False, "error": str(e), "type": "IMAGE_MCQ"
                }
                invalid += 1
                img_total += 1
                continue
            is_img = True
        else:
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
            output_text = processor.batch_decode(
                generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False
            )[0]

            parsed = parse_answer(output_text)
            is_correct = (parsed == correct_answer)
            if is_correct:
                correct += 1
                if is_img: img_correct += 1
                else: txt_correct += 1
            if parsed == "INVALID":
                invalid += 1

            if is_img: img_total += 1
            else: txt_total += 1

            q_type = "IMG" if is_img else "TXT"
            status = "PASS" if is_correct else "FAIL"
            results[ann_id] = {
                "raw": output_text,
                "parsed": parsed,
                "correct_answer": correct_answer,
                "latency": time.time() - start_t,
                "correct": is_correct,
                "type": "IMAGE_MCQ" if is_img else "TEXT_MCQ",
                "error": None
            }
            print(f"[{i+1}/{total}] {ann_id} [{q_type}]: {parsed} (GT: {correct_answer}) - {status}")

        except Exception as e:
            if is_img: img_total += 1
            else: txt_total += 1
            results[ann_id] = {
                "raw": "",
                "parsed": "INVALID",
                "correct_answer": correct_answer,
                "latency": time.time() - start_t,
                "correct": False,
                "type": "IMAGE_MCQ" if is_img else "TEXT_MCQ",
                "error": str(e)
            }
            invalid += 1
            print(f"[{i+1}/{total}] {ann_id}: ERROR: {e}")

    accuracy = (correct / total) * 100 if total > 0 else 0
    img_acc = (img_correct / img_total) * 100 if img_total > 0 else 0
    txt_acc = (txt_correct / txt_total) * 100 if txt_total > 0 else 0
    invalid_rate = (invalid / total) * 100 if total > 0 else 0
    avg_latency = (time.time() - start_all) / total if total > 0 else 0

    metrics = {
        "overall_correct": correct,
        "overall_total": total,
        "overall_accuracy": accuracy,
        "text_correct": txt_correct,
        "text_total": txt_total,
        "text_accuracy": txt_acc,
        "image_correct": img_correct,
        "image_total": img_total,
        "image_accuracy": img_acc,
        "invalid_count": invalid,
        "invalid_rate": invalid_rate,
        "avg_latency": avg_latency,
    }

    print(f"\n{prefix} Results:")
    print(f"  Overall: {correct}/{total} ({accuracy:.1f}%)")
    print(f"  TEXT_MCQ: {txt_correct}/{txt_total} ({txt_acc:.1f}%)")
    print(f"  IMAGE_MCQ: {img_correct}/{img_total} ({img_acc:.1f}%)")
    print(f"  Invalid: {invalid}/{total} ({invalid_rate:.1f}%)")
    print(f"  Avg Latency: {avg_latency:.2f}s")

    return results, metrics


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--adapter-path", type=str, required=True, help="Path to the LoRA adapter")
    parser.add_argument("--base-model-id", type=str, default="Qwen/Qwen2.5-VL-3B-Instruct")
    args = parser.parse_args()

    # --- Step 1: Build and validate test mapping ---
    print("--- BUILDING TEST MAPPING ---")
    test_mapping = build_test_mapping()

    img_count = sum(1 for m in test_mapping if m['has_image'])
    txt_count = sum(1 for m in test_mapping if not m['has_image'])
    print(f"  Mapped: {len(test_mapping)} examples")
    print(f"  IMAGE_MCQ: {img_count}, TEXT_MCQ: {txt_count}")
    print(f"  Unique annotation_ids: {len({m['annotation_id'] for m in test_mapping})}")
    print("  All 54 frozen test IDs matched uniquely. ✓")

    # --- Step 2: Load model and processor ---
    print(f"\nLoading base model: {args.base_model_id}")
    from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor
    processor = AutoProcessor.from_pretrained(
        args.base_model_id,
        min_pixels=MIN_PIXELS,
        max_pixels=MAX_PIXELS
    )
    print(f"  Processor min_pixels={MIN_PIXELS}, max_pixels={MAX_PIXELS}")

    device_map = "auto"
    torch_dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float32

    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        args.base_model_id,
        device_map=device_map,
        torch_dtype=torch_dtype
    )
    model.eval()

    # --- Step 3: Evaluate base model ---
    print("\n--- Evaluating Base Model ---")
    base_results, base_metrics = evaluate_model(model, processor, test_mapping, prefix="Base Model")

    eval_dir = os.path.join(os.path.dirname(__file__), 'evaluation')
    os.makedirs(eval_dir, exist_ok=True)
    with open(os.path.join(eval_dir, 'base_qwen25_results.json'), "w") as f:
        json.dump({"metrics": base_metrics, "per_example": base_results}, f, indent=2)

    # --- Step 4: Load adapter and evaluate finetuned model ---
    print(f"\nLoading LoRA adapter from: {args.adapter_path}")
    model = PeftModel.from_pretrained(model, args.adapter_path)
    model.eval()

    print("\n--- Evaluating Finetuned Model ---")
    ft_results, ft_metrics = evaluate_model(model, processor, test_mapping, prefix="Finetuned Model")

    with open(os.path.join(eval_dir, 'finetuned_qwen25_lora_results.json'), "w") as f:
        json.dump({"metrics": ft_metrics, "per_example": ft_results}, f, indent=2)

    # --- Step 5: Comparison table ---
    print("\n=======================================================")
    print("COMPARISON ARTIFACT")
    print("=======================================================")
    hdr = f"{'Model':<20} | {'Overall':>12} | {'TEXT_MCQ':>12} | {'IMAGE_MCQ':>12} | {'Invalid':>8} | {'Latency':>8}"
    print(hdr)
    print("-" * len(hdr))
    b = base_metrics
    f_ = ft_metrics
    print(f"{'Base (zero-shot)':<20} | {b['overall_correct']:>3}/{b['overall_total']:<3} {b['overall_accuracy']:>5.1f}% | {b['text_correct']:>3}/{b['text_total']:<3} {b['text_accuracy']:>5.1f}% | {b['image_correct']:>3}/{b['image_total']:<3} {b['image_accuracy']:>5.1f}% | {b['invalid_count']:>5}   | {b['avg_latency']:>5.2f}s")
    print(f"{'Finetuned (LoRA)':<20} | {f_['overall_correct']:>3}/{f_['overall_total']:<3} {f_['overall_accuracy']:>5.1f}% | {f_['text_correct']:>3}/{f_['text_total']:<3} {f_['text_accuracy']:>5.1f}% | {f_['image_correct']:>3}/{f_['image_total']:<3} {f_['image_accuracy']:>5.1f}% | {f_['invalid_count']:>5}   | {f_['avg_latency']:>5.2f}s")
    print("=======================================================\n")


if __name__ == "__main__":
    main()
