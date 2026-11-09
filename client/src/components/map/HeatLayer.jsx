import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

export default function HeatLayer({ points = [], radius = 25, blur = 15, maxZoom = 17 }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    // points formatted as [lat, lng, intensity]
    const heatPoints = points.map((p) => [
      Number(p.lat),
      Number(p.lng),
      Math.min(1.0, Math.max(0.3, (Number(p.total) || 1) / 5)),
    ]);

    const heatLayer = L.heatLayer(heatPoints, {
      radius,
      blur,
      maxZoom,
      max: 1.0,
      gradient: {
        0.2: '#3b82f6',
        0.4: '#06b6d4',
        0.6: '#10b981',
        0.8: '#f59e0b',
        1.0: '#ef4444',
      },
    });

    heatLayer.addTo(map);

    return () => {
      if (map && heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points, radius, blur, maxZoom]);

  return null;
}

