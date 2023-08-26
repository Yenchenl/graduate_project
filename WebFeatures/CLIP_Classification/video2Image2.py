import cv2

def extract_frames(video_path, num_frames):
    vidcap = cv2.VideoCapture(video_path)
    total_frames = int(vidcap.get(cv2.CAP_PROP_FRAME_COUNT))
    step = total_frames // (num_frames + 1)  # 计算每个间隔的步长

    frames = []
    count = 0
    success = True

    while count < total_frames and len(frames) < num_frames:
        vidcap.set(cv2.CAP_PROP_POS_FRAMES, count)
        success, image = vidcap.read()
        
        if success:
            frames.append(image)
        
        count += step

    vidcap.release()
    return frames


