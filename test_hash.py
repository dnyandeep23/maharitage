import json, hashlib
with open("src/ai/quiz-engine/v2/dataset/Aja0003/image/annotations.json") as f:
    data = json.load(f)
for q in data:
    if q.get('image_url'):
        url = q['image_url']
        url_hash = hashlib.md5(url.encode()).hexdigest()[:6]
        print(f"URL: {url} -> Hash: {url_hash}")
