import os
import sys
import argparse
import yaml
import json
import torch
import time
import hashlib

# Constants
V2_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MASTER_JSON = os.path.join(V2_DIR, 'benchmark', 'v2.0.1_master.json')

def load_config():
    config_path = os.path.join(os.path.dirname(__file__), 'config.yaml')
    with open(config_path, 'r') as f:
        return yaml.safe_load(f)

def verify_data_integrity():
    print("\n--- VERIFYING DATA INTEGRITY ---")
    
    with open(MASTER_JSON, 'rb') as f:
        data_bytes = f.read()
    sha = hashlib.sha256(data_bytes).hexdigest()
    expected_sha = "3951af0d0c4de8874e6ef963645ecd0110b359f03c246cc692ec4ee4f3e97b63"
    assert sha == expected_sha, f"Hash mismatch: expected {expected_sha}, got {sha}"
    print(f"Dataset hash verified: {sha}")

    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    train_file = os.path.join(data_dir, 'train.jsonl')
    val_file = os.path.join(data_dir, 'validation.jsonl')
    test_file = os.path.join(data_dir, 'test.jsonl')
    
    with open(train_file) as f: train_data = [json.loads(l) for l in f]
    with open(val_file) as f: val_data = [json.loads(l) for l in f]
    with open(test_file) as f: test_data = [json.loads(l) for l in f]
        
    assert len(train_data) == 657, f"Expected 657 train examples, got {len(train_data)}"
    assert len(val_data) == 23, f"Expected 23 validation examples, got {len(val_data)}"
    assert len(test_data) == 54, f"Expected 54 test examples, got {len(test_data)}"
    print(f"Dataset Counts -> Train: {len(train_data)}, Val: {len(val_data)}, Test: {len(test_data)}")

    for item in train_data + val_data + test_data:
        # Excluded record check
        ann_id = item.get("annotation_id", "")
        # Note: dataset prepared without annotation_id in messages, but we check if it was retained.
        # Wait, the prepare_dataset script does not save annotation_id in the JSONL! It only saves messages and images.
        # Let's verify images instead.
        if "images" in item and item["images"]:
            for img in item["images"]:
                assert os.path.exists(img), f"Image missing: {img}"
                
    print("Data integrity verified successfully.")
    return train_data, val_data, test_data

class AssistantOnlyVLMCollator:
    def __init__(self, processor):
        from trl.trainer.sft_trainer import DataCollatorForVisionLanguageModeling
        self.processor = processor
        self.base_collator = DataCollatorForVisionLanguageModeling(processor=processor)
        self.assistant_prefix = "<|im_start|>assistant\n"
        self.assistant_tokens = self.processor.tokenizer.encode(self.assistant_prefix, add_special_tokens=False)

    def __call__(self, examples):
        batch = self.base_collator(examples)
        labels = batch["labels"].clone()
        prefix_len = len(self.assistant_tokens)
        
        for i in range(len(labels)):
            seq = batch["input_ids"][i].tolist()
            match_idx = -1
            for j in range(len(seq) - prefix_len + 1):
                if seq[j:j+prefix_len] == self.assistant_tokens:
                    match_idx = j + prefix_len
                    break
            if match_idx != -1:
                labels[i, :match_idx] = -100
        batch["labels"] = labels
        return batch

def run_mac_validation(config):
    print("\n--- MAC-SIDE STATIC VALIDATION ---")
    train_data, val_data, test_data = verify_data_integrity()
    
    try:
        from transformers import AutoProcessor
    except ImportError:
        print("Missing transformers. Cannot verify locally.")
        return

    print(f"\nLoading processor for {config['model_id']}...")
    processor = AutoProcessor.from_pretrained(config['model_id'])
    
    print("\nVerifying Target Modules...")
    try:
        from transformers import Qwen2_5_VLForConditionalGeneration
        model = Qwen2_5_VLForConditionalGeneration.from_pretrained(config['model_id'], device_map="cpu", torch_dtype=torch.float32)
        matched_modules = set()
        for name, module in model.named_modules():
            if "visual" in name.lower() or "vision" in name.lower():
                continue
            if any(target in name for target in config['lora_target_modules']):
                matched_modules.add(name)
        print(f"Found {len(matched_modules)} instances of {config['lora_target_modules']} in model architecture.")
        assert len(matched_modules) > 0, "No LoRA modules matched!"
        
        # Verify vision tower is NOT in target modules
        vision_matches = [m for m in matched_modules if "visual" in m.lower() or "vision" in m.lower()]
        assert len(vision_matches) == 0, f"Vision tower modules matched: {vision_matches}"
        print("Vision tower correctly excluded from LoRA targets.")
        
        # Verify SFTTrainer initialization
        from trl import SFTTrainer, SFTConfig
        from datasets import Dataset
        print("\nVerifying SFTTrainer Initialization...")
        dummy_config = SFTConfig(
            output_dir="dummy",
            loss_type="nll",
            max_length=None,
        )
        dummy_dataset = Dataset.from_dict({"messages": [[{"role": "user", "content": [{"type": "text", "text": "Hi"}]}]]})
        trainer = SFTTrainer(
            model=model,
            args=dummy_config,
            train_dataset=dummy_dataset,
            processing_class=processor,
        )
        print("SFTTrainer instantiated successfully.")
        
    except ImportError:
        print("Skipping module match validation because it requires loading the model.")

    print("\nMac validation successfully completed.")

def setup_training(config, mode="full"):
    from datasets import load_dataset, Image, Sequence
    from transformers import Qwen2_5_VLForConditionalGeneration, AutoProcessor
    from peft import LoraConfig, get_peft_model
    
    print(f"\n--- SETTING UP {mode.upper()} ---")
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    dataset = load_dataset('json', data_files={
        'train': os.path.join(data_dir, 'train.jsonl'),
        'validation': os.path.join(data_dir, 'validation.jsonl')
    })
    
    dataset = dataset.cast_column("images", Sequence(Image(decode=True)))
    
    print(f"Loading processor: {config['model_id']}")
    processor = AutoProcessor.from_pretrained(config['model_id'])
    
    # Kaggle T4 configuration: fp16
    torch_dtype = torch.float16
    print(f"Loading model: {config['model_id']} with dtype {torch_dtype}")
    
    model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
        config['model_id'], 
        device_map="auto", 
        torch_dtype=torch_dtype
    )
    
    peft_target_modules = set()
    for name, module in model.named_modules():
        if "visual" in name.lower() or "vision" in name.lower():
            continue
        if any(t in name for t in config['lora_target_modules']):
            peft_target_modules.add(name)
            
    peft_config = LoraConfig(
        r=config['lora_r'],
        lora_alpha=config['lora_alpha'],
        lora_dropout=config['lora_dropout'],
        bias="none",
        target_modules=list(peft_target_modules),
        task_type="CAUSAL_LM"
    )
    
    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()
    
    collator = AssistantOnlyVLMCollator(processor=processor)
    
    return model, processor, collator, dataset

def run_smoke_test(config):
    from trl import SFTTrainer, SFTConfig
    model, processor, collator, dataset = setup_training(config, mode="smoke test")
    
    img_ds = dataset['train'].filter(lambda x: len(x['images']) > 0).select(range(1))
    txt_ds = dataset['train'].filter(lambda x: len(x['images']) == 0).select(range(1))
    
    from datasets import concatenate_datasets
    smoke_dataset = concatenate_datasets([img_ds, txt_ds])
    smoke_dataset = concatenate_datasets([smoke_dataset] * 80)
    
    # --- PRE-TRAINING LABEL MASKING VERIFICATION ---
    print("\n--- VERIFYING LABEL MASKING ---")
    for label, ds in [("IMAGE_MCQ", img_ds), ("TEXT_MCQ", txt_ds)]:
        batch = collator([ds[0]])
        labels = batch["labels"][0]
        unmasked = (labels != -100).nonzero(as_tuple=True)[0]
        num_unmasked = len(unmasked)
        seq_len = len(labels)
        decoded = processor.tokenizer.decode(labels[unmasked].tolist()) if num_unmasked > 0 else "<NONE>"
        print(f"  {label}: seq_len={seq_len}, unmasked_labels={num_unmasked}, decoded={repr(decoded)}")
        assert num_unmasked > 0, f"{label}: All labels masked!"
        assert num_unmasked < 10, f"{label}: Too many unmasked labels ({num_unmasked}), masking is broken!"
        assert "ANSWER:" in decoded, f"{label}: Unmasked labels don't contain 'ANSWER:': {decoded}"
    print("Label masking verified: only assistant answer tokens are trainable.")
    
    training_args = SFTConfig(
        output_dir=os.path.join(os.path.dirname(__file__), 'checkpoints_smoke'),
        per_device_train_batch_size=config['batch_size'],
        gradient_accumulation_steps=config['gradient_accumulation_steps'],
        learning_rate=config['learning_rate'],
        max_steps=20,
        fp16=True,
        bf16=False,
        max_length=None,
        dataset_kwargs={"skip_prepare_dataset": True},
        save_strategy="no",
        remove_unused_columns=False,
        gradient_checkpointing=config['gradient_checkpointing'],
        gradient_checkpointing_kwargs={"use_reentrant": False} if config['gradient_checkpointing'] else None,
        logging_steps=1,
        report_to="none",
        loss_type="nll"
    )
    
    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=smoke_dataset,
        peft_config=None,
        processing_class=processor,
        data_collator=collator,
    )
    
    print("\n--- STARTING SMOKE TEST ---")
    start_t = time.time()
    trainer.train()
    duration = time.time() - start_t
    
    print(f"\nSmoke test completed in {duration:.2f} seconds.")
    if torch.cuda.is_available():
        print(f"Peak Memory Allocation: {torch.cuda.max_memory_allocated() / (1024**3):.2f} GB")
    
    # Verify gradients via logged grad_norm (post-train .grad is cleared by optimizer)
    grad_norms = [entry.get('grad_norm', 0) for entry in trainer.state.log_history if 'grad_norm' in entry]
    has_nonzero_grad = any(g > 0 for g in grad_norms)
    print(f"Logged grad_norms: {grad_norms[:5]}... (total {len(grad_norms)} entries)")
    assert has_nonzero_grad, f"No non-zero grad_norm found in training logs! grad_norms={grad_norms}"
    print("Gradient flow verified via logged grad_norms.")
    
    # Save and verify adapter
    adapter_path = os.path.join(os.path.dirname(__file__), 'checkpoints_smoke', 'adapter')
    trainer.model.save_pretrained(adapter_path)
    assert os.path.exists(os.path.join(adapter_path, 'adapter_config.json')), "adapter_config.json missing!"
    print(f"Smoke test adapter saved and verified at {adapter_path}.")

def run_full_training(config):
    from trl import SFTTrainer, SFTConfig
    model, processor, collator, dataset = setup_training(config, mode="full")
    
    total_steps = (len(dataset['train']) // (config['batch_size'] * config['gradient_accumulation_steps'])) * config['epochs']
    warmup_steps = int(total_steps * config.get('warmup_ratio', 0.1))
    
    training_args = SFTConfig(
        output_dir=os.path.join(os.path.dirname(__file__), 'checkpoints'),
        per_device_train_batch_size=config['batch_size'],
        gradient_accumulation_steps=config['gradient_accumulation_steps'],
        learning_rate=config['learning_rate'],
        lr_scheduler_type=config['scheduler'],
        warmup_steps=warmup_steps,
        num_train_epochs=config['epochs'],
        fp16=True, 
        bf16=False,
        max_length=None,
        dataset_kwargs={"skip_prepare_dataset": True},
        save_strategy="epoch",
        eval_strategy="epoch",
        remove_unused_columns=False,
        gradient_checkpointing=config['gradient_checkpointing'],
        gradient_checkpointing_kwargs={"use_reentrant": False} if config['gradient_checkpointing'] else None,
        logging_steps=10,
        loss_type="nll"
    )

    trainer = SFTTrainer(
        model=model,
        args=training_args,
        train_dataset=dataset['train'],
        eval_dataset=dataset['validation'],
        peft_config=None,
        processing_class=processor,
        data_collator=collator,
    )

    print("\n--- STARTING FULL TRAINING ---")
    trainer.train()
    
    final_output = os.path.join(os.path.dirname(__file__), 'checkpoints', 'final_adapter')
    trainer.model.save_pretrained(final_output)
    print(f"Adapter saved to {final_output}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--validate", action="store_true", help="Run local Mac validation")
    parser.add_argument("--smoke-test", action="store_true", help="Run 20-50 step smoke test")
    parser.add_argument("--full-training", action="store_true", help="Run full training")
    args = parser.parse_args()

    config = load_config()

    if args.validate:
        run_mac_validation(config)
    elif args.smoke_test:
        verify_data_integrity()
        run_smoke_test(config)
    elif args.full_training:
        verify_data_integrity()
        run_full_training(config)
    else:
        print("Please specify --validate, --smoke-test, or --full-training")

if __name__ == "__main__":
    main()
