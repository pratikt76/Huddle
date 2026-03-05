import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isMapLink, parseMapLink } from '../utils/parseMapLink';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function HomePage() {
    const [yourName, setYourName] = useState('');
    const [destination, setDestination] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');
    const [searchTimeout, setSearchTimeout] = useState(null);
    const [mapLinkDetected, setMapLinkDetected] = useState(false);
    const navigate = useNavigate();

    const searchPlaces = async (query) => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
                { headers: { 'Accept-Language': 'en' } }
            );
            const data = await res.json();
            setSuggestions(data.map(item => ({
                name: item.display_name,
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon)
            })));
        } catch {
            setSuggestions([]);
        }
    };

    const handleDestinationChange = (e) => {
        const value = e.target.value;
        setDestination(value);
        setSelectedPlace(null);
        setError('');
        setMapLinkDetected(false);
        setSuggestions([]);

        // Check if it's a map link
        if (isMapLink(value)) {
            setMapLinkDetected(true);
            const parsed = parseMapLink(value);
            if (parsed) {
                if (parsed.lat && parsed.lng) {
                    // Direct coordinates found
                    const placeName = parsed.name || `${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)}`;
                    setSelectedPlace({ name: placeName, lat: parsed.lat, lng: parsed.lng });
                    setDestination(placeName);
                    setMapLinkDetected(false);
                    return;
                } else if (parsed.searchQuery) {
                    // Has a text query, search for it
                    setDestination(parsed.searchQuery);
                    searchPlaces(parsed.searchQuery);
                    setMapLinkDetected(false);
                    return;
                }
            }
            return;
        }

        // Normal text search with debounce
        if (searchTimeout) clearTimeout(searchTimeout);
        setSearchTimeout(setTimeout(() => searchPlaces(value), 400));
    };

    const handleSelectPlace = (place) => {
        setSelectedPlace(place);
        setDestination(place.name.split(',').slice(0, 2).join(','));
        setSuggestions([]);
    };

    const handleCreate = async () => {
        if (!yourName.trim()) {
            setError('Please enter your name');
            return;
        }
        if (!selectedPlace) {
            setError('Please select a destination from the suggestions');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            const res = await fetch(`${SERVER_URL}/create-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destination: {
                        name: destination,
                        lat: selectedPlace.lat,
                        lng: selectedPlace.lng
                    }
                })
            });

            if (!res.ok) throw new Error('Failed to create session');
            const data = await res.json();
            // Store the user's name in sessionStorage so the meetup page can use it
            sessionStorage.setItem(`huddle_name_${data.sessionId}`, yourName.trim());
            navigate(`/meetup/${data.sessionId}`);
        } catch (err) {
            setError('Failed to create meetup. Is the server running?');
            setIsCreating(false);
        }
    };

    return (
        <div className="home-page">
            <div className="hero-section">
                {/* Animated background blobs */}
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>

                <div className="hero-content">
                    <div className="logo-section">
                        <div className="logo-icon">
                            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="24" cy="24" r="22" fill="url(#logoGrad)" opacity="0.15" />
                                <path d="M24 4C16.27 4 10 10.27 10 18c0 10.5 14 26 14 26s14-15.5 14-26c0-7.73-6.27-14-14-14z"
                                    fill="url(#logoGrad)" stroke="white" strokeWidth="1.5" />
                                <circle cx="24" cy="18" r="6" fill="white" opacity="0.9" />
                                <circle cx="18" cy="28" r="3" fill="#A78BFA" opacity="0.6" />
                                <circle cx="30" cy="30" r="2.5" fill="#60A5FA" opacity="0.6" />
                                <circle cx="24" cy="34" r="2" fill="#34D399" opacity="0.6" />
                                <defs>
                                    <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
                                        <stop stopColor="#818CF8" />
                                        <stop offset="1" stopColor="#6366F1" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h1 className="app-title">Huddle</h1>
                        <p className="app-tagline">Meet up. Track together. Arrive as one.</p>
                    </div>

                    <div className="create-card">
                        <h2>Create a Meetup</h2>
                        <p className="card-desc">Enter your name and destination to get started</p>

                        <div className="input-group">
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
                                    </svg>
                                </span>
                                <input
                                    id="name-input"
                                    type="text"
                                    placeholder="Your name"
                                    value={yourName}
                                    onChange={(e) => { setYourName(e.target.value); setError(''); }}
                                    autoComplete="off"
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <div className="input-wrapper">
                                <span className="input-icon">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="M21 21l-4.35-4.35" />
                                    </svg>
                                </span>
                                <input
                                    id="destination-input"
                                    type="text"
                                    placeholder="Search a place or paste a Google/Apple Maps link"
                                    value={destination}
                                    onChange={handleDestinationChange}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                    autoComplete="off"
                                />
                            </div>

                            {mapLinkDetected && (
                                <div className="map-link-badge">
                                    🔗 Map link detected — extracting location...
                                </div>
                            )}

                            {selectedPlace && !suggestions.length && (
                                <div className="selected-place-badge">
                                    ✅ {selectedPlace.name}
                                </div>
                            )}

                            {suggestions.length > 0 && (
                                <ul className="suggestions-list">
                                    {suggestions.map((s, i) => (
                                        <li key={i} onClick={() => handleSelectPlace(s)}>
                                            <span className="suggestion-icon">📍</span>
                                            <span className="suggestion-text">{s.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        {error && <p className="error-message">{error}</p>}

                        <button
                            id="create-button"
                            className="create-button"
                            onClick={handleCreate}
                            disabled={isCreating || !selectedPlace || !yourName.trim()}
                        >
                            {isCreating ? (
                                <span className="loading-spinner"></span>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M12 5v14M5 12h14" />
                                    </svg>
                                    Create Meetup
                                </>
                            )}
                        </button>
                    </div>

                    <div className="features-row">
                        <div className="feature">
                            <span className="feature-icon">🔗</span>
                            <span>Share a link</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">📍</span>
                            <span>See everyone live</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">🚫</span>
                            <span>No login needed</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
