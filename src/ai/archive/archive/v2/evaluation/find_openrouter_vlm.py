import os
import json
import time
import requests

DATASET_PATH = "src/ai/quiz-engine/v2/dataset/pilot_annotations_final.json"
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/models"
OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions"

def get_test_item():
    with open(DATASET_PATH, 'r') as f:
        data = json.load(f)
    for item in data:
        if item.get("question_type") == "IMAGE_MCQ":
            return item
    return None

def find_working_openrouter_vlm():
    print("Fetching OpenRouter model catalog...")
    response = requests.get(OPENROUTER_API_URL)
    response.raise_for_status()
    models = response.json().get("data", [])
    
    # Filter for free, non-routing models that likely support vision
    candidates = []
    for model in models:
        m_id = model["id"]
        pricing = model.get("pricing", {})
        
        # Must be completely free
        try:
            prompt_cost = float(pricing.get("prompt", -1))
            completion_cost = float(pricing.get("completion", -1))
            image_cost = float(pricing.get("image", 0)) # some have image cost
        except:
            continue
            
        if prompt_cost == 0.0 and completion_cost == 0.0 and image_cost == 0.0:
            if m_id.endswith(":free") and "auto" not in m_id:
                # OpenRouter usually maps explicit free variants with :free suffix 
                # (e.g. google/gemini-2.0-flash-exp:free or qwen/qwen-2-vl-7b-instruct:free)
                # Let's check for vision indicators
                arch = model.get("architecture", {})
                modality = arch.get("modality", "")
                
                is_vision = "vision" in m_id.lower() or "vl" in m_id.lower() or "multimodal" in modality.lower() or "image" in modality.lower() or "pixtral" in m_id.lower() or "gemini" in m_id.lower() or "llama-3.2" in m_id.lower()
                
                if is_vision:
                    candidates.append(model)
                    
    print(f"Found {len(candidates)} potential free vision models with stable identifiers.")
    
    # Sort candidates to prefer smaller/specific models if possible, but any working one is fine.
    # Qwen-VL, Pixtral, Llama-3.2-Vision are good small/mid-size ones.
    candidates.sort(key=lambda x: "qwen" not in x["id"].lower()) 

    item = get_test_item()
    if not item:
        print("No test item found.")
        return
        
    image_url = item["image_url"]
    prompt = f"Answer this multiple-choice question. Return ONLY A, B, C, or D.\n\nQuestion:\n{item['question']}\n\nA. {item['options'][0]}\nB. {item['options'][1]}\nC. {item['options'][2]}\nD. {item['options'][3]}"

    # Read key from .env.local if present
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key and os.path.exists(".env.local"):
        with open(".env.local") as env_file:
            for line in env_file:
                if line.startswith("OPENROUTER_API_KEY="):
                    api_key = line.strip().split("=", 1)[1].strip('"').strip("'")
                    break

    if not api_key:
        print("OPENROUTER_API_KEY is not set. Requests will fail if auth is required.")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    for model in candidates:
        model_id = model["id"]
        print(f"\n--- Testing Model: {model_id} ---")
        
        # Test 1: Image + Text
        payload_img = {
            "model": model_id,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {"url": image_url}
                        },
                        {
                            "type": "text",
                            "text": prompt
                        }
                    ]
                }
            ],
            "max_tokens": 20
        }
        
        start = time.time()
        try:
            res_img = requests.post(OPENROUTER_CHAT_URL, headers=headers, json=payload_img)
            res_img.raise_for_status()
            out_img = res_img.json()["choices"][0]["message"]["content"]
            lat_img = int((time.time() - start) * 1000)
            print(f"Image Request: SUCCESS ({lat_img}ms) -> {out_img.strip()}")
            
            # Test 2: Text Only
            payload_txt = {
                "model": model_id,
                "messages": [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": prompt
                            }
                        ]
                    }
                ],
                "max_tokens": 20
            }
            
            start = time.time()
            res_txt = requests.post(OPENROUTER_CHAT_URL, headers=headers, json=payload_txt)
            res_txt.raise_for_status()
            out_txt = res_txt.json()["choices"][0]["message"]["content"]
            lat_txt = int((time.time() - start) * 1000)
            print(f"Text Request: SUCCESS ({lat_txt}ms) -> {out_txt.strip()}")
            
            print("\nSuccessfully found a working OpenRouter VLM. STOPPING.")
            
            # Print final report
            print("\n=== REPORT ===")
            print(f"model ID: {model_id}")
            print(f"provider: OpenRouter")
            print(f"pricing = free")
            print(f"image support: Yes")
            print(f"latency (image): {lat_img}ms")
            print(f"raw output (image): {out_img.strip()}")
            return
            
        except Exception as e:
            lat = int((time.time() - start) * 1000)
            print(f"STATUS: FAILED ({lat}ms)")
            if isinstance(e, requests.exceptions.HTTPError):
                print(f"Error: {e.response.text}")
            else:
                print(f"Error: {e}")
            
        time.sleep(1)

    print("\nNo working free models found on OpenRouter.")

if __name__ == "__main__":
    find_working_openrouter_vlm()
