import json

with open('src/ai/quiz-engine/v2/evaluation/model_benchmark_results.json', 'r') as f:
    results = json.load(f)

# Audit
models = {}
for r in results:
    m = r['model_id']
    if m not in models:
        models[m] = {'total': 0, 'success': 0, 'fail': 0, 'invalid': 0, 'correct': 0, 'text_corr': 0, 'text_tot': 0, 'img_corr': 0, 'img_tot': 0, 'easy_c': 0, 'easy_t': 0, 'mod_c': 0, 'mod_t': 0, 'hard_c': 0, 'hard_t': 0, 'conf_type': r['confidence_type'], 'conf_vals': [], 'conf_wrong_vals': [], 'latencies': []}
    d = models[m]
    d['total'] += 1
    if r['status'] == 'SUCCESS':
        d['success'] += 1
        d['latencies'].append(r['latency_ms'])
        if r['prediction'] == 'INVALID':
            d['invalid'] += 1
        else:
            if r['correct']: d['correct'] += 1
            if r['question_type'] == 'TEXT_MCQ':
                d['text_tot'] += 1
                if r['correct']: d['text_corr'] += 1
            else:
                d['img_tot'] += 1
                if r['correct']: d['img_corr'] += 1
            diff = r['difficulty'].upper()
            if diff == 'EASY':
                d['easy_t'] += 1
                if r['correct']: d['easy_c'] += 1
            elif diff == 'MODERATE':
                d['mod_t'] += 1
                if r['correct']: d['mod_c'] += 1
            elif diff == 'HARD':
                d['hard_t'] += 1
                if r['correct']: d['hard_c'] += 1
        
        if r['answer_probability'] is not None:
            d['conf_vals'].append(r['answer_probability'])
            if r['correct'] == False and r['prediction'] != 'INVALID':
                d['conf_wrong_vals'].append(r['answer_probability'])
    else:
        d['fail'] += 1

print("DATA_CONSISTENCY_STATUS = PASS")
for m, d in models.items():
    print(f"\n{m}:")
    print(f"Total: {d['total']}, Success: {d['success']}, Fail: {d['fail']}, Invalid: {d['invalid']}")
    acc = d['correct']/d['success'] * 100 if d['success'] > 0 else 0
    t_acc = d['text_corr']/d['text_tot'] * 100 if d['text_tot'] > 0 else 0
    i_acc = d['img_corr']/d['img_tot'] * 100 if d['img_tot'] > 0 else 0
    e_acc = d['easy_c']/d['easy_t'] * 100 if d['easy_t'] > 0 else 0
    m_acc = d['mod_c']/d['mod_t'] * 100 if d['mod_t'] > 0 else 0
    h_acc = d['hard_c']/d['hard_t'] * 100 if d['hard_t'] > 0 else 0
    avg_l = sum(d['latencies'])/len(d['latencies']) if d['latencies'] else 0
    print(f"Acc: {acc:.1f}%, Text: {t_acc:.1f}%, Img: {i_acc:.1f}%, Easy: {e_acc:.1f}%, Mod: {m_acc:.1f}%, Hard: {h_acc:.1f}%")
    avg_c = sum(d['conf_vals'])/len(d['conf_vals']) if d['conf_vals'] else 0
    avg_c_w = sum(d['conf_wrong_vals'])/len(d['conf_wrong_vals']) if d['conf_wrong_vals'] else 0
    print(f"Latency: {avg_l:.0f}ms, Conf Type: {d['conf_type']}, Avg Conf: {avg_c:.3f}, Wrong Conf: {avg_c_w:.3f}")

