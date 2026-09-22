import os
import json
import time
import requests
from huggingface_hub import HfApi, InferenceClient
from huggingface_hub.utils import HfHubHTTPError

DATASET_PATH = "src/ai/quiz-engine/v2/dataset/pilot_annotations_final.json"

def get_test_item():
    with open(DATASET_PATH, 'r') as f:
        data = json.load(f)
    for item in data:
        if item.get("question_type") == "IMAGE_MCQ":
            return item
    return None

def find_working_vlm():
    api = HfApi()
    token = os.environ.get("HF_TOKEN") or None
    
    # We will also try checking if we can get the models from huggingface API directly
    print("Searching for popular image-text-to-text models on Hugging Face...")
    
    # These are highly popular and likely to have inference providers
    models_to_test = [
        "meta-llama/Llama-3.2-11B-Vision-Instruct",
        "Qwen/Qwen2-VL-72B-Instruct",
        "Qwen/Qwen2-VL-7B-Instruct",
        "Qwen/Qwen2.5-VL-7B-Instruct",
        "Qwen/Qwen2.5-VL-72B-Instruct",
        "llava-hf/llava-1.5-7b-hf",
        "HuggingFaceM4/idefics2-8b"
    ]
    
    # Providers supported by HF Inference API routing
    providers = ["hf-inference", "together", "fal-ai", "replicate", "fireworks-ai", "novita"]

    item = get_test_item()
    if not item:
        print("No test item found.")
        return
        
    image_url = item["image_url"]
    prompt = f"Answer this multiple-choice question. Return ONLY A, B, C, or D.\n\nQuestion:\n{item['question']}\n\nA. {item['options'][0]}\nB. {item['options'][1]}\nC. {item['options'][2]}\nD. {item['options'][3]}"

    for model_id in models_to_test:
        for provider in providers:
            print(f"\n--- Testing Model: {model_id} via Provider: {provider} ---")
            
            # Hugging Face InferenceClient currently accepts a provider argument in newer versions
            try:
                # If inferenceclient doesn't accept provider in init, we might have to pass it in headers
                # or rely on the underlying routing. Let's try passing it to headers.
                headers = {}
                if provider != "hf-inference":
                    headers["X-Provider"] = provider
                    
                client = InferenceClient(model=model_id, token=token, headers=headers)
                
                start = time.time()
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
                
                print("STATUS: SUCCESS")
                print(f"Latency: {latency} ms")
                print(f"Output: {response.choices[0].message.content}")
                
                print("\nFound working hosted VLM! STOPPING.")
                return
                
            except Exception as e:
                err_str = str(e)
                print(f"STATUS: FAILED")
                if "model_not_supported" in err_str:
                    print("Error: model_not_supported by this provider/enabled settings.")
                elif "unauthorized" in err_str.lower() or "token" in err_str.lower() or "401" in err_str:
                    print("Error: Unauthorized. Token missing or invalid for this provider.")
                elif "does not exist" in err_str.lower():
                    print("Error: Model does not exist.")
                else:
                    print(f"Error: {e}")
                
                # Small delay to prevent hitting API limits too hard on failure
                time.sleep(0.5)

if __name__ == "__main__":
    find_working_vlm()
