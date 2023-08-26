from ultralytics import YOLO
import sys

inputModel = "yolov8n-shoes-seg.pt"
# inputImg = "pexels-photo-1179229.jpeg"
inputImg = sys.argv[1]

model = YOLO(inputModel)  # load a pretrained YOLOv8n segmentation model
# model(inputImg)  # predict on an image
# results = model(inputImg)  # predict on an image
model(inputImg, save=False, verbose=False)

results = model.predict(inputImg, verbose=False)
result = results[0]
if result:
    # len(result.boxes)
    # box = result.boxes[0]
    # print("Object type:", box.cls)
    # print("Coordinates:", box.xyxy)
    # print("Probability:", box.conf)
    # print()
    # print()
    # print("Object type:",box.cls[0])
    # print("Coordinates:",box.xyxy[0])
    # print("Probability:",box.conf[0])
    # print()
    # print()

    # cords = box.xyxy[0].tolist()
    # class_id = box.cls[0].item()
    # conf = box.conf[0].item()
    # print("Object type:", class_id)
    # print("Coordinates:", cords)
    # print("Probability:", conf)
    # print(result.names)
    # print()
    # print()

    print("是鞋子")
else:
    print("不是鞋子")