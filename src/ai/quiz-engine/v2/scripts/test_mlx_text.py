from mlx_vlm import load, generate
model, processor = load("mlx-community/Qwen2-VL-2B-Instruct-4bit")
prompt = "Who is the ruler? A: Gupta, B: Maurya, C: Vakataka, D: Satavahana"
messages = [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
prompt_txt = processor.apply_chat_template(messages, add_generation_prompt=True)
res = generate(model, processor, prompt_txt, verbose=False, max_tokens=10, temp=0.0)
print(getattr(res, 'text', str(res)))
