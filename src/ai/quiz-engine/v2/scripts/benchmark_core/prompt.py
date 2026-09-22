SYSTEM_PROMPT = "You are answering a multiple-choice Maharashtra heritage question.\n\nChoose exactly one option: A, B, C, or D.\n\nReturn only:\n\nANSWER: A"

def format_question(q):
    prompt = f"{SYSTEM_PROMPT}\n\nQuestion: {q['question']}\n"
    for opt in ['A', 'B', 'C', 'D']:
        prompt += f"{opt}: {q['options'][opt]}\n"
    return prompt
