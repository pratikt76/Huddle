import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons in Leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Create a colored SVG marker icon
function createColoredIcon(color, isDestination = false) {
    const size = isDestination ? 40 : 32;
    const svg = isDestination
        ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
        <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
        <circle cx="12" cy="9" r="4" fill="white"/>
        <path d="M10 8l4 2-4 2V8z" fill="${color}"/>
      </svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}">
        <path d="M12 0C7.03 0 3 4.03 3 9c0 6.75 9 15 9 15s9-8.25 9-15c0-4.97-4.03-9-9-9z" fill="${color}" stroke="#fff" stroke-width="1.5"/>
        <circle cx="12" cy="8.5" r="4" fill="white" opacity="0.9"/>
      </svg>`;

    return L.divIcon({
        html: svg,
        className: 'custom-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size],
    });
}

// Component to auto-fit map bounds
function FitBounds({ markers, destination }) {
    const map = useMap();
    const prevBoundsRef = useRef(null);

    useEffect(() => {
        const points = [];
        if (destination?.lat && destination?.lng) {
            points.push([destination.lat, destination.lng]);
        }
        markers.forEach(m => {
            if (m.lat && m.lng) points.push([m.lat, m.lng]);
        });

        if (points.length === 0) return;

        const boundsKey = JSON.stringify(points);
        if (prevBoundsRef.current === boundsKey) return;
        prevBoundsRef.current = boundsKey;

        if (points.length === 1) {
            map.setView(points[0], 14);
        } else {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
        }
    }, [markers, destination, map]);

    return null;
}

export default function MapView({ destination, participants, mySocketId }) {
    const activeParticipants = participants.filter(p => p.lat != null && p.lng != null);

    return (
        <MapContainer
            center={destination ? [destination.lat, destination.lng] : [20, 0]}
            zoom={destination ? 13 : 3}
            className="map-container"
            zoomControl={false}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {/* Destination marker */}
            {destination && (
                <Marker
                    position={[destination.lat, destination.lng]}
                    icon={createColoredIcon('#FF6B6B', true)}
                >
                    <Popup className="custom-popup">
                        <div className="popup-content">
                            <span className="popup-icon">📍</span>
                            <strong>{destination.name}</strong>
                            <span className="popup-label">Destination</span>
                        </div>
                    </Popup>
                </Marker>
            )}

            {/* Participant markers */}
            {activeParticipants.map((p) => (
                <Marker
                    key={p.socketId}
                    position={[p.lat, p.lng]}
                    icon={createColoredIcon(p.color)}
                >
                    <Popup className="custom-popup">
                        <div className="popup-content">
                            <span className="popup-dot" style={{ background: p.color }}></span>
                            <strong>{p.name}</strong>
                            {p.socketId === mySocketId && <span className="popup-label">You</span>}
                        </div>
                    </Popup>
                </Marker>
            ))}

            <FitBounds markers={activeParticipants} destination={destination} />
        </MapContainer>
    );
}
