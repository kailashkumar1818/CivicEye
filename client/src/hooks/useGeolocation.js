import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useGeolocation() {
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [accuracy, setAccuracy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getLocation = useCallback((fallbackCoords = null) => {
    if (!navigator.geolocation) {
      const errMsg = 'Geolocation is not supported by your browser';
      setError(errMsg);
      toast.error(errMsg);
      if (fallbackCoords) setCoords(fallbackCoords);
      return Promise.reject(new Error(errMsg));
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy: acc } = pos.coords;
          const lat = parseFloat(latitude.toFixed(6));
          const lng = parseFloat(longitude.toFixed(6));
          const result = { lat, lng };

          setCoords(result);
          setAccuracy(acc);
          setLoading(false);

          if (acc > 100) {
            toast('GPS accuracy is low (>100m). Please adjust the map pin if needed.', {
              icon: '📍',
            });
          } else {
            toast.success(`Location locked within ${Math.round(acc)}m accuracy`);
          }

          resolve(result);
        },
        (err) => {
          setLoading(false);
          let errMsg = 'Failed to obtain GPS location';
          if (err.code === 1) errMsg = 'Location permission denied by user';
          else if (err.code === 2) errMsg = 'Location information unavailable';
          else if (err.code === 3) errMsg = 'Location request timed out';

          setError(errMsg);

          if (fallbackCoords) {
            setCoords(fallbackCoords);
            toast('Using fallback location coordinates.', { icon: 'ℹ️' });
            resolve(fallbackCoords);
          } else {
            toast.error(errMsg);
            reject(err);
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    });
  }, []);

  return {
    coords,
    accuracy,
    loading,
    error,
    getLocation,
    setCoords,
  };
}

export default useGeolocation;

