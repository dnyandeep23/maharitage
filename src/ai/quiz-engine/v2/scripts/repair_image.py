import os
import sys
import json
import requests
from PIL import Image

def main():
    target_img_id = "Fort0001_img_0863e4"
    url = "https://res.cloudinary.com/ddstiusga/image/upload/v1777241177/Gangasagar_lake_ahwln5.jpg"
    cache_path = f"src/ai/quiz-engine/v2/benchmark/images/{target_img_id}.jpg"
    temp_path = cache_path + ".tmp"
    
    # 1. Investigate current cache
    if os.path.exists(cache_path):
        size = os.path.getsize(cache_path)
        print(f"OLD_FILE_SIZE: {size} bytes")
        try:
            with Image.open(cache_path) as img:
                img.verify()
            print("OLD_PIL_VERIFY: PASS")
            with Image.open(cache_path) as img:
                img.load()
            print("OLD_PIL_LOAD: PASS")
        except Exception as e:
            print(f"OLD_PIL_LOAD: FAIL - {e}")
            
    # 2. Redownload
    print(f"\nDownloading from {url}...")
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    
    with open(temp_path, "wb") as f:
        f.write(resp.content)
        
    new_size = os.path.getsize(temp_path)
    print(f"NEW_FILE_SIZE: {new_size} bytes")
    
    # 3. Verify new file
    verify_pass = False
    load_pass = False
    try:
        with Image.open(temp_path) as img:
            img.verify()
        verify_pass = True
        print("PIL_VERIFY: PASS")
        
        with Image.open(temp_path) as img:
            img.load()
        load_pass = True
        print("PIL_LOAD: PASS")
    except Exception as e:
        print(f"Verification Failed: {e}")
        
    if verify_pass and load_pass:
        os.replace(temp_path, cache_path)
        print(f"Successfully replaced {cache_path}")
    else:
        print("Failed to repair image!")
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    main()
