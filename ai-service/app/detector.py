import io
import os
import time
from PIL import Image

CIVIC_CATEGORIES = ["pothole", "garbage", "broken_streetlight", "damaged_road", "other"]

class Detector:
    def __init__(self, path: str, conf: float = 0.4, iou: float = 0.45, imgsz: int = 640, device: str = "cpu"):
        self.path = path
        self.conf = conf
        self.iou = iou
        self.imgsz = imgsz
        self.device = device
        self.model = None
        self._load_model()

    def _load_model(self):
        """
        Attempts to load YOLO model once at startup.
        Supports custom weights or fallback model without blocking on remote downloads.
        """
        if os.path.exists(self.path):
            try:
                from ultralytics import YOLO
                self.model = YOLO(self.path)
                print(f"[Detector] Loaded custom weights from {self.path}")
                return
            except Exception as e:
                print(f"[Detector] Could not load model from {self.path}: {e}")

        # Check if generic yolov8n.pt exists locally (only load if file is on disk to prevent remote download hang)
        if os.path.exists("yolov8n.pt") or os.path.exists(os.path.join(os.path.dirname(self.path), "yolov8n.pt")):
            try:
                from ultralytics import YOLO
                model_file = "yolov8n.pt" if os.path.exists("yolov8n.pt") else os.path.join(os.path.dirname(self.path), "yolov8n.pt")
                self.model = YOLO(model_file)
                print(f"[Detector] Loaded local fallback model from {model_file}")
                return
            except Exception as e:
                print(f"[Detector] Error loading fallback model: {e}")

        print("[Detector] No local weight file found. Operating in fast local inference / fallback mode.")
        self.model = None

    def predict(self, data: bytes):
        """
        Run inference on image bytes.
        Returns:
            detections (list of dicts), image_width, image_height, dominant_category, confidence
        """
        img = Image.open(io.BytesIO(data)).convert("RGB")
        w, h = img.size

        # If image is very large, thumbnail it before inference to save memory
        if max(w, h) > 1600:
            img.thumbnail((1600, 1600))
            w, h = img.size

        dets = []

        if self.model is not None:
            try:
                res = self.model.predict(
                    img,
                    conf=self.conf,
                    iou=self.iou,
                    imgsz=self.imgsz,
                    device=self.device,
                    verbose=False,
                )[0]

                for b in res.boxes:
                    x1, y1, x2, y2 = b.xyxy[0].tolist()
                    cls_id = int(b.cls)
                    raw_name = self.model.names.get(cls_id, str(cls_id)).lower()

                    # Map model class name to civic category
                    mapped_label = "other"
                    for cat in CIVIC_CATEGORIES:
                        if cat in raw_name or raw_name in cat:
                            mapped_label = cat
                            break

                    conf = round(float(b.conf), 3)
                    area_ratio = round(((x2 - x1) * (y2 - y1)) / (w * h), 4)

                    dets.append({
                        "label": mapped_label,
                        "confidence": conf,
                        "bbox": [round(x1), round(y1), round(x2), round(y2)],
                        "area_ratio": area_ratio,
                    })
            except Exception as e:
                print(f"[Detector] Inference error: {e}")

        # If no detections found from model, evaluate heuristic detection
        if not dets:
            # Clean fallback: no detections -> category "other", confidence 0
            dominant_category = "other"
            top_confidence = 0.0
        else:
            # Pick the label with highest (confidence * area_ratio) - the dominant object
            dominant_det = max(dets, key=lambda d: d["confidence"] * d["area_ratio"])
            dominant_category = dominant_det["label"]
            top_confidence = dominant_det["confidence"]

        return dets, w, h, dominant_category, top_confidence
