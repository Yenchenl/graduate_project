import os
import torch
from CLIP import clip
from PIL import Image
import csv
import matplotlib.pyplot as plt

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)


def read_class_text_from_csv(csv_file, encoding='utf-8'):
    with open(csv_file, 'r', encoding=encoding, errors='replace') as file:
        reader = csv.reader(file)
        class_text = [row[1] for row in reader]  # 读取每一行第二个元素
    return class_text

def extract_subseries_from_csv(csv_file, brand_name, encoding='utf-8'):
    with open(csv_file, 'r', encoding=encoding, errors='replace') as file:
        reader = csv.reader(file)
        next(reader)  # 跳过CSV文件的标题行
        subseries = [row[3].strip() for row in reader if row[1].strip() == brand_name]
    return subseries

def predict(image_file, class_text):
    image = preprocess(Image.open(image_file)).unsqueeze(0).to(device)
    text = clip.tokenize(class_text).to(device)

    with torch.no_grad():
        image_features = model.encode_image(image)
        text_features = model.encode_text(text)

        logits_per_image, logits_per_text = model(image, text)
        brand_probs = logits_per_image.softmax(dim=-1).cpu().numpy()

    return brand_probs

def predict_brand(image_file, class_text):
    brand_probs = predict(image_file, class_text)

    max_brand_prob = 0.0
    max_brand_index = -1
    for i, prob in enumerate(brand_probs[0]):
        if prob > max_brand_prob:
            max_brand_prob = prob
            max_brand_index = i

    if max_brand_index != -1:
        max_brand = class_text[max_brand_index]
        # print(f"Brand Prediction: {max_brand}: {max_brand_prob}")
        return max_brand, max_brand_prob

def predict_series(image_file, class_text, count):
    brand_probs = predict(image_file, class_text)

    max_brand_prob = 0.0
    max_brand_index = -1
    for i, prob in enumerate(brand_probs[0]):
        if prob > max_brand_prob:
            max_brand_prob = prob
            max_brand_index = i

    if max_brand_index != -1:
        max_brand = class_text[max_brand_index]
        # print(f"Brand Prediction{count}: {max_brand}: {max_brand_prob}")
        return max_brand, max_brand_prob


