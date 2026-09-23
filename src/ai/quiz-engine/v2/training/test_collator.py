import os
import yaml
from datasets import load_dataset, Image, Sequence
from transformers import AutoProcessor
from trl.trainer.sft_trainer import DataCollatorForVisionLanguageModeling

config_path = os.path.join(os.path.dirname(__file__), 'config.yaml')
with open(config_path, 'r') as f:
    config = yaml.safe_load(f)

data_dir = os.path.join(os.path.dirname(__file__), 'data')
dataset = load_dataset('json', data_files={'train': os.path.join(data_dir, 'train.jsonl')})['train']

dataset = dataset.cast_column("images", Sequence(Image(decode=True)))

processor = AutoProcessor.from_pretrained(config['model_id'])
collator = DataCollatorForVisionLanguageModeling(
    processor=processor,
)

img_item = next(item for item in dataset if item["images"] is not None and len(item["images"]) > 0)
txt_item = next(item for item in dataset if item["images"] is None or len(item["images"]) == 0)

print("IMAGE_MCQ Messages:")
print(img_item["messages"])
print("IMAGE_MCQ Images:", img_item["images"])

print("\nTEXT_MCQ Messages:")
print(txt_item["messages"])
print("TEXT_MCQ Images:", txt_item["images"])

print("\nRunning collator on IMAGE_MCQ...")
batch_img = collator([img_item])
print("IMAGE_MCQ Shapes:")
print("input_ids shape:", batch_img["input_ids"].shape)
print("attention_mask shape:", batch_img["attention_mask"].shape)
print("labels shape:", batch_img["labels"].shape)
if "pixel_values" in batch_img:
    print("pixel_values shape:", batch_img["pixel_values"].shape)
if "image_grid_thw" in batch_img:
    print("image_grid_thw shape:", batch_img["image_grid_thw"].shape)

print("\nRunning collator on TEXT_MCQ...")
batch_txt = collator([txt_item])
print("TEXT_MCQ Shapes:")
print("input_ids shape:", batch_txt["input_ids"].shape)
print("attention_mask shape:", batch_txt["attention_mask"].shape)
print("labels shape:", batch_txt["labels"].shape)
if "pixel_values" in batch_txt:
    print("pixel_values shape:", batch_txt["pixel_values"].shape)
if "image_grid_thw" in batch_txt:
    print("image_grid_thw shape:", batch_txt["image_grid_thw"].shape)

print("\nCollator test passed successfully.")
