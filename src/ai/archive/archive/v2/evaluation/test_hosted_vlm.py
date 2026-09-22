import os
import json
import time
from huggingface_hub import InferenceClient

MODELS = [
    "HuggingFaceTB/SmolVLM-256M-Instruct",
    "HuggingFaceTB/SmolVLM2-500M-Video-Instruct",
    "HuggingFaceTB/SmolVLM2-2.2B-Instruct",
    "HuggingFaceTB/SmolVLM-Instruct",
    "Qwen/Qwen2.5-VL-3B-Instruct"
]

DATASET_PATH = "src/ai/quiz-engine/v2/dataset/pilot_annotations_final.json"

def get_test_item():
    with open(DATASET_PATH, 'r') as f:
        data = json.load(f)
    for item in data:
        if item.get("question_type") == "IMAGE_MCQ":
            return item
    return None

def test_models():
    item = get_test_item()
    if not item:
        print("No IMAGE_MCQ found for testing.")
        return

    image_url = item["image_url"]
    prompt = f"Answer this multiple-choice question. Return ONLY A, B, C, or D.\n\nQuestion:\n{item['question']}\n\nA. {item['options'][0]}\nB. {item['options'][1]}\nC. {item['options'][2]}\nD. {item['options'][3]}"

    print(f"Test Image: {image_url}")
    print("---")

    token = os.environ.get("HF_TOKEN")
    
    for model_id in MODELS:
        print(f"\nEvaluating Model: {model_id}")
        
        client = InferenceClient(model=model_id, token=token)
        start = time.time()
        
        try:
            # We use chat completions API with multimodal inputs
            response = client.chat.completions.create(
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": image_url}},
                            {"type": "text", "text": prompt}
                        ]
                    }
                ],
                max_tokens=20
            )
            end = time.time()
            latency = int((end - start) * 1000)
            
            print(f"STATUS: SUCCESS")
            print(f"Latency: {latency} ms")
            print(f"Raw Response: {response.choices[0].message.content}")
            print(f"Provider metadata: {response}")
            
            # Stop at the first successful model
            print("\nSuccessfully found a working hosted VLM. STOPPING.")
            return
            
        except Exception as e:
            end = time.time()
            latency = int((end - start) * 1000)
            print(f"STATUS: FAILED")
            print(f"Latency: {latency} ms")
            print(f"Error: {e}")

if __name__ == "__main__":
    test_models()
