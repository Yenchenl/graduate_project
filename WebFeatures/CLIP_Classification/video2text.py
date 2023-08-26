import cv2
import os
import torch
from CLIP import clip
from PIL import Image
import csv
import matplotlib.pyplot as plt
import video2Image2
import test2
import glob
import sys

input_data = sys.argv[1]

# 使用示例
video_path = input_data
# video_path = "./WebFeatures/CLIP_Classification/shoesVideoinput/video1.mp4"
num_frames = 10

extracted_frames = video2Image2.extract_frames(video_path, num_frames)

# 将抓取的图片保存到文件中
for i, frame in enumerate(extracted_frames):
    cv2.imwrite(f'./WebFeatures/CLIP_Classification/shoes/shoesPic1/shoes_{i+1}.jpg', frame)

device = "cuda" if torch.cuda.is_available() else "cpu"
model, preprocess = clip.load("ViT-B/32", device=device)

# 要读取的鞋子数据
csv_file = './WebFeatures/CLIP_Classification/shoes/test3.csv'
# 鞋子图片文件夹路径
shoes_folder = './WebFeatures/CLIP_Classification/shoes/shoesPic1'

# 读取CSV文件中的文本
class_text = test2.read_class_text_from_csv(csv_file, encoding='utf-8')
unique_class_text = list(set(class_text))

# 存储每个系列对应的概率总和和计数
series_probabilities = {}
series_counts = {}

# 处理每个鞋子图片
count = 1  # 增加计数器
for filename in os.listdir(shoes_folder):
    if filename.endswith('.jpg'):
        image_file = os.path.join(shoes_folder, filename)

        # 预测品牌
        brand_name, brand_prob = test2.predict_brand(image_file, unique_class_text)

        if brand_name:
            # 提取品牌对应的系列
            subseries = test2.extract_subseries_from_csv(csv_file, brand_name)
            unique_subseries = list(set(subseries))

            # 预测系列
            series_name, series_prob = test2.predict_series(image_file, unique_subseries, count)

            # 累加系列对应的概率和计数
            if series_name in series_probabilities:
                series_probabilities[series_name] += series_prob
                series_counts[series_name] += 1
            else:
                series_probabilities[series_name] = series_prob
                series_counts[series_name] = 1
        count += 1  # 增加计数器

# 找到具有最大概率的系列及其原始概率
max_prob_series = max(series_probabilities, key=series_probabilities.get)
max_prob = series_probabilities[max_prob_series] / series_counts[max_prob_series]

print(brand_name)
# print("Max Probability Series:", max_prob_series)
print(max_prob_series)
# print("Max Probability:", max_prob)

print("XXX")
print("XXX")
print("XXX")
print("XXX")

## delete all of image
jpg_files = glob.glob(os.path.join(shoes_folder, '*.jpg'))

# 删除所有.jpg文件
for file in jpg_files:
    os.remove(file)