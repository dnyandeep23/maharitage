import os
import json
import argparse
import torch
from datasets import load_dataset
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
from transformers import AutoProcessor, Qwen2VLForConditionalGeneration, BitsAndBytesConfig
from trl import SFTTrainer, SFTConfig

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--smoke-test", action="store_true", help="Run 20 steps only")
    parser.add_argument("--train", action="store_true", help="Run full 2 epochs")
    parser.add_argument("--model", type=str, default="Qwen/Qwen2-VL-2B-Instruct")
    parser.add_argument("--output_dir", type=str, default="checkpoints")
    return parser.parse_args()

def main():
    args = parse_args()
    if not args.train and not args.smoke_test:
        print("Must specify --train or --smoke-test")
        return
        
    print("Loading config...")
    with open('config.json', 'r') as f:
        cfg = json.load(f)
        
    print("Loading datasets...")
    # HF datasets load jsonl format
    train_ds = load_dataset('json', data_files='train.jsonl', split='train')
    val_ds = load_dataset('json', data_files='validation.jsonl', split='train')
    
    print("Initializing BitsAndBytes...")
    bnb_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_compute_dtype=torch.float16,
        bnb_4bit_quant_type="nf4"
    )
    
    print("Loading Qwen2-VL model...")
    processor = AutoProcessor.from_pretrained(args.model)
    model = Qwen2VLForConditionalGeneration.from_pretrained(
        args.model,
        quantization_config=bnb_config,
        device_map="auto"
    )
    
    model = prepare_model_for_kbit_training(model)
    
    lora_config = LoraConfig(
        r=cfg['lora_r'],
        lora_alpha=cfg['lora_alpha'],
        lora_dropout=cfg['lora_dropout'],
        target_modules=cfg['target_modules'],
        task_type="CAUSAL_LM"
    )
    model = get_peft_model(model, lora_config)
    
    def formatting_func(example):
        texts = []
        for msg in example['messages']:
            # The SFTTrainer needs string targets, so we apply chat template
            pass # Usually handled by SFTTrainer dataset kwargs for chat format
        return example
        
    sft_config = SFTConfig(
        output_dir=args.output_dir,
        per_device_train_batch_size=cfg['batch_size'],
        gradient_accumulation_steps=cfg['gradient_accumulation_steps'],
        learning_rate=cfg['learning_rate'],
        num_train_epochs=cfg['epochs'] if not args.smoke_test else 1,
        max_steps=20 if args.smoke_test else -1,
        logging_steps=5,
        save_strategy="epoch" if not args.smoke_test else "steps",
        save_steps=10 if args.smoke_test else 500,
        evaluation_strategy="epoch" if not args.smoke_test else "no",
        save_total_limit=3,
        load_best_model_at_end=True if not args.smoke_test else False,
        metric_for_best_model="eval_loss",
        dataset_kwargs={"skip_prepare_dataset": True}
    )
    
    def data_collator(features):
        texts = [processor.apply_chat_template(f["messages"], tokenize=False, add_generation_prompt=False) for f in features]
        # In a real Qwen2-VL training script, images would be loaded via PIL here.
        # This is a boilerplate shell for the actual GPU run.
        inputs = processor(text=texts, return_tensors="pt", padding=True)
        inputs["labels"] = inputs["input_ids"].clone()
        return inputs
    
    trainer = SFTTrainer(
        model=model,
        args=sft_config,
        train_dataset=train_ds,
        eval_dataset=val_ds,
        data_collator=data_collator,
    )
    
    print("Starting Training...")
    trainer.train()
    
    print("Saving Final Model...")
    trainer.save_model(os.path.join(args.output_dir, "final"))

if __name__ == '__main__':
    main()
