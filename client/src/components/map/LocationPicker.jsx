import React, { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import mapApi from '../../api/map';
import useGeolocation from '../../hooks/useGeolocation';
import { Navigation, MapPin, Loader2 } from 'lucide-react';

const tileUrl =
  import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

// Custom SVG Pin to avoid Leaflet default asset bundling issues in Vite
const pinIcon = L.divIcon({
  className: 'custom-location-pin',
  html: `
    <div style="transform: translate(-50%, -100%);">
      <div style="background-color: #2563eb; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
        <div style="width: 10px; height: 10px; background-color: white; border-radius: 50%;"></div>
      </div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

// Inner helper component to pan map when coordinates change
function RecenterMap({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([lat, lng], map.getZoom(), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

// Inner helper component to handle map click events
function MapClickHandler({ onLocationChange }) {
  useMapEvents({
    click(e) {
      onLocationChange(
        parseFloat(e.latlng.lat.toFixed(6)),
        parseFloat(e.latlng.lng.toFixed(6))
      );
    },
  });
  return null;
}

export default function LocationPicker({
  lat = 17.385,
  lng = 78.4867,
  onChange,
  onAddressResolved,
}) {
  const markerRef = useRef(null);
  const { getLocation, loading: locating } = useGeolocation();
  const [geocoding, setGeocoding] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState('');

  // Handle position changes and reverse geocode
  const handlePositionChange = async (newLat, newLng) => {
    onChange({ lat: newLat, lng: newLng });

    // Reverse geocode
    setGeocoding(true);
    try {
      const geo = await mapApi.reverseGeocode(newLat, newLng);
      if (geo && geo.address) {
        setResolvedAddress(geo.address);
        if (onAddressResolved) {
          onAddressResolved(geo);
        }
      }
    } catch (err) {
      console.warn('Reverse geocode failed:', err);
    } finally {
      setGeocoding(false);
    }
  };

  // Drag handler for marker
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newPos = marker.getLatLng();
          handlePositionChange(
            parseFloat(newPos.lat.toFixed(6)),
            parseFloat(newPos.lng.toFixed(6))
          );
        }
      },
    }),
    [handlePositionChange]
  );

  const handleLocateMe = async () => {
    try {
      const pos = await getLocation();
      if (pos) {
        handlePositionChange(pos.lat, pos.lng);
      }
    } catch {
      // Handled by hook toast
    }
  };

  return (
    <div className="space-y-2">
      {/* Map Header with Controls */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-blue-600" />
          Click or drag marker to set exact problem location
        </span>
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locating}
          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md transition-colors disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 mr-1 ${locating ? 'animate-spin' : ''}`} />
          {locating ? 'Locating...' : 'My Location'}
        </button>
      </div>

      {/* Map Container */}
      <div className="h-64 sm:h-72 w-full rounded-xl overflow-hidden border border-slate-300 shadow-inner relative z-0">
        <MapContainer
          center={[lat, lng]}
          zoom={15}
          scrollWheelZoom={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url={tileUrl}
          />
          <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={[lat, lng]}
            ref={markerRef}
            icon={pinIcon}
          />
          <RecenterMap lat={lat} lng={lng} />
          <MapClickHandler onLocationChange={handlePositionChange} />
        </MapContainer>
      </div>

      {/* Geocoded Address Preview */}
      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 truncate">
          <span className="font-semibold text-slate-700 whitespace-nowrap">Selected:</span>
          {geocoding ? (
            <span className="text-slate-400 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Resolving address...
            </span>
          ) : (
            <span className="text-slate-600 truncate">
              {resolvedAddress || `Lat: ${lat}, Lng: ${lng}`}
            </span>
          )}
        </div>
        <span className="text-[10px] font-mono text-slate-400 pl-2 whitespace-nowrap">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </span>
      </div>
    </div>
  );
}

