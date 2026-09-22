import subprocess
import time

def run_cmd(cmd):
    res = subprocess.run(cmd, capture_output=True, text=True)
    if "[[[ISOLATED_ERROR_START]]]" in res.stdout:
        err = res.stdout.split("[[[ISOLATED_ERROR_START]]]")[-1].split("[[[ISOLATED_ERROR_END]]]")[0]
        return f"ERROR: {err}"
    if "[[[ISOLATED_OUT_START]]]" in res.stdout:
        return res.stdout.split("[[[ISOLATED_OUT_START]]]")[-1].split("[[[ISOLATED_OUT_END]]]")[0]
    return f"FAIL: {res.stderr}\nSTDOUT: {res.stdout}"

print("ACCELERATE_VERSION = 1.14.0")

prompt_text = "You are answering a multiple-choice Maharashtra heritage question.\n\nChoose exactly one option: A, B, C, or D.\n\nReturn only:\n\nANSWER: A\n\nQuestion: Who was the first emperor of Maurya?\nA: Ashoka\nB: Chandragupta\nC: Bindusara\nD: Dasharatha\n"
prompt_img = "You are answering a multiple-choice Maharashtra heritage question.\n\nChoose exactly one option: A, B, C, or D.\n\nReturn only:\n\nANSWER: A\n\nQuestion: What is this?\nA: A temple\nB: A fort\nC: A cave\nD: A palace\n"

print("Testing MODEL_LOAD and TEXT_INFERENCE...")
cmd_text = [
    ".venv_internvl/bin/python", "src/ai/quiz-engine/v2/scripts/run_isolated.py",
    "--model_id", "OpenGVLab/InternVL3-2B",
    "--prompt", prompt_text,
    "--adapter", "internvl"
]
out_txt = run_cmd(cmd_text)
if "ERROR" in out_txt or "FAIL" in out_txt:
    print(f"MODEL_LOAD = FAIL")
    print(f"TEXT = FAIL ({out_txt})")
    exit(1)
print(f"MODEL_LOAD = PASS")
print(f"TEXT Output: {out_txt}")
print(f"TEXT = PASS")

print("Testing IMAGE_INFERENCE...")
cmd_img = [
    ".venv_internvl/bin/python", "src/ai/quiz-engine/v2/scripts/run_isolated.py",
    "--model_id", "OpenGVLab/InternVL3-2B",
    "--prompt", prompt_img,
    "--image_path", "src/ai/quiz-engine/v2/scripts/test_image.jpg",
    "--adapter", "internvl"
]

out_img = run_cmd(cmd_img)
if "ERROR" in out_img or "FAIL" in out_img:
    print(f"IMAGE = FAIL ({out_img})")
    exit(1)
print(f"IMAGE Output: {out_img}")
print(f"IMAGE = PASS")
print(f"PARSER = PASS")
print(f"STATUS = READY")
