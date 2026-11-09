# AI Service (Python + FastAPI + YOLO)

## Goal
Take a photo → return what civic problem it shows, how confident, and how severe.

## Folder Structure
```
ai-service/
├── requirements.txt
├── .env / .env.example
├── models/               # civiceye-yolov8n.pt (gitignored)
├── training/
│   ├── data.yaml
│   └── train.py
└── app/
    ├── main.py           # FastAPI app, auth dependency
    ├── config.py         # reads .env
    ├── detector.py       # loads model once, runs inference
    ├── severity.py
    └── schemas.py
```

`requirements.txt`
```
fastapi
uvicorn[standard]
python-multipart
ultralytics
opencv-python-headless
pillow
pydantic-settings
```

## Step 1 — Get a Model (choose one)

| Option | Effort | Notes |
|--------|--------|-------|
| **A. Pre-trained pothole weights** (Roboflow Universe) | Low | Pothole only. Use for the MVP. |
| **B. Fine-tune YOLOv8n on a merged multi-class dataset** | Medium | Needed for all 4 categories. Recommended. |
| **C. Pothole model + fallback "other"** | Low | Ship first, then improve. |

Recommended path: ship with A in Week 5, train B in parallel (Google Colab, free GPU).

### Dataset sources
Search Roboflow Universe and Kaggle for: pothole, garbage/waste, streetlight/lamp post, road crack/damage. Merge into 4 classes and keep the licenses.
Also add about 10% **negative images** (normal roads) to cut false positives.
Prefer images from Indian roads if available (lighting and road texture differ from foreign datasets).

### Training (`training/train.py`)
```python
from ultralytics import YOLO
model = YOLO("yolov8n.pt")
model.train(data="data.yaml", epochs=60, imgsz=640, batch=16, patience=15)
metrics = model.val()
print(metrics.box.map50, metrics.box.mp, metrics.box.mr)
```
`data.yaml`
```yaml
path: ./dataset
train: images/train
val: images/val
names:
  0: pothole
  1: garbage
  2: broken_streetlight
  3: damaged_road
```
Copy `runs/detect/train/weights/best.pt` to `models/civiceye-yolov8n.pt`.

**Record the metrics (precision, recall, mAP@0.5) in the README.** Comparable student projects report around 60%, so keep the human-confirms step in the UI.

## Step 2 — Inference API

### `POST /predict` (header `X-API-Key`, multipart `image`)
Response:
```json
{
  "category": "pothole",
  "confidence": 0.87,
  "severity": "high",
  "detections": [
    {"label": "pothole", "confidence": 0.87, "bbox": [120, 340, 410, 520], "area_ratio": 0.18}
  ],
  "image": {"width": 1280, "height": 960},
  "inference_ms": 140
}
```
No detections → `{"category": "other", "confidence": 0, "severity": "low", "detections": []}`.

### `GET /health` → `{"status":"ok","model_loaded":true}`

## Core Logic (`detector.py`)
```python
from ultralytics import YOLO
from PIL import Image
import io

class Detector:
    def __init__(self, path, conf, iou, imgsz, device):
        self.model = YOLO(path)          # load ONCE at startup
        self.conf, self.iou, self.imgsz, self.device = conf, iou, imgsz, device

    def predict(self, data: bytes):
        img = Image.open(io.BytesIO(data)).convert("RGB")
        w, h = img.size
        res = self.model.predict(img, conf=self.conf, iou=self.iou,
                                 imgsz=self.imgsz, device=self.device, verbose=False)[0]
        dets = []
        for b in res.boxes:
            x1, y1, x2, y2 = b.xyxy[0].tolist()
            dets.append({
                "label": self.model.names[int(b.cls)],
                "confidence": round(float(b.conf), 3),
                "bbox": [round(x1), round(y1), round(x2), round(y2)],
                "area_ratio": round(((x2-x1)*(y2-y1)) / (w*h), 4),
            })
        return dets, w, h
```

## Category Selection
Pick the label with the highest `confidence × area_ratio` (the dominant object), not just the highest confidence.

## Severity (`severity.py`)
```
largest area_ratio of the chosen category:
   < SEVERITY_MEDIUM_RATIO (0.05)  → low
   < SEVERITY_HIGH_RATIO   (0.15)  → medium
   otherwise                       → high
Garbage: count of detections can bump severity up one level (3+ items).
```
Bounding-box size is only a rough proxy for severity. Document this limit.

## Server Integration (`server/src/services/aiClient.js`)
- `axios` + `form-data`, header `X-API-Key`, timeout `AI_REQUEST_TIMEOUT_MS`.
- Retry once on timeout (Render free tier cold start can take about 1 minute).
- On failure return `{ai_status:'unavailable'}` and let submission continue.
- Warm-up: the client calls `/health` when the report page opens.

## Guardrails
- Max image 5 MB; reject non-image MIME types; resize large images to 640 before inference.
- Never trust the AI blindly: confidence below 0.40 sets `needs_review`.
- Log the AI category vs final category to measure accuracy (`/analytics/ai-accuracy`).

## Future Upgrades
- Image segmentation for area estimation.
- Night / low-light augmentation.
- Active learning: admin-corrected categories become new training data.
