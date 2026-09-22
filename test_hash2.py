import json, hashlib
with open("all_cloudinary_refs.json") as f:
    data = json.load(f)
for url in data:
    url_hash = hashlib.md5(url.encode()).hexdigest()[:6]
    if url_hash == "8eea05":
        print(f"FOUND 8eea05: {url}")
        break
