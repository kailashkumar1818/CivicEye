"""
Severity estimation based on bounding-box area ratio and item counts.
"""

SEVERITY_MEDIUM_RATIO = 0.05
SEVERITY_HIGH_RATIO = 0.15

def calculate_severity(category: str, detections: list) -> str:
    """
    Calculate severity level ('low', 'medium', 'high') based on the largest detection's
    area ratio and detection count.
    """
    if not detections:
        return "low"

    category_dets = [d for d in detections if d.get("label") == category]
    if not category_dets:
        category_dets = detections

    # Find the largest area ratio among the relevant detections
    max_area_ratio = max((d.get("area_ratio", 0) for d in category_dets), default=0)

    if max_area_ratio < SEVERITY_MEDIUM_RATIO:
        severity = "low"
    elif max_area_ratio < SEVERITY_HIGH_RATIO:
        severity = "medium"
    else:
        severity = "high"

    # Garbage: count of detections can bump severity up one level (3+ items)
    if category == "garbage" and len(category_dets) >= 3:
        if severity == "low":
            severity = "medium"
        elif severity == "medium":
            severity = "high"

    return severity

