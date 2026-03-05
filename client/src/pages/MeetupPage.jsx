import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { useGeolocation } from '../hooks/useGeolocation';
import MapView from '../components/Map';
import ParticipantList from '../components/ParticipantList';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function MeetupPage() {
    const { sessionId } = useParams();
    const [session, setSession] = useState(null);
    const [loadError, setLoadError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    // Name entry state
    const storedName = sessionStorage.getItem(`huddle_name_${sessionId}`) || '';
    const [userName, setUserName] = useState(storedName);
    const [nameInput, setNameInput] = useState('');
    const [hasJoined, setHasJoined] = useState(!!storedName);

    const { isConnected, participants, identity, error: socketError, updateLocation } = useSocket(
        hasJoined ? sessionId : null,
        userName
    );
    const { isTracking, error: geoError, startTracking, stopTracking } = useGeolocation(updateLocation);

    // Fetch session data
    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`${SERVER_URL}/session/${sessionId}`);
                if (!res.ok) throw new Error('Session not found');
                const data = await res.json();
                setSession(data);
            } catch {
                setLoadError('This meetup session was not found or has expired.');
            }
        }
        if (sessionId) load();
    }, [sessionId]);

    const handleJoin = () => {
        const name = nameInput.trim();
        if (!name) return;
        setUserName(name);
        sessionStorage.setItem(`huddle_name_${sessionId}`, name);
        setHasJoined(true);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const openGoogleMaps = () => {
        const { lat, lng } = session.destination;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    const openAppleMaps = () => {
        const { lat, lng, name } = session.destination;
        window.open(`https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d&t=m`, '_blank');
    };

    // Find my socketId from participants
    const mySocketId = participants.find(
        p => p.name === identity?.name && p.color === identity?.color
    )?.socketId;

    if (loadError) {
        return (
            <div className="meetup-error">
                <div className="error-card">
                    <span className="error-emoji">😕</span>
                    <h2>Session Not Found</h2>
                    <p>{loadError}</p>
                    <a href="/" className="back-button">← Create a new meetup</a>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="meetup-loading">
                <div className="loading-spinner large"></div>
                <p>Loading meetup...</p>
            </div>
        );
    }

    // Name entry gate
    if (!hasJoined) {
        return (
            <div className="name-entry-page">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="name-entry-card">
                    <div className="name-entry-header">
                        <div className="logo-icon-small">
                            <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
                                <path d="M24 4C16.27 4 10 10.27 10 18c0 10.5 14 26 14 26s14-15.5 14-26c0-7.73-6.27-14-14-14z"
                                    fill="url(#nLogoGrad)" stroke="white" strokeWidth="1.5" />
                                <circle cx="24" cy="18" r="6" fill="white" opacity="0.9" />
                                <defs>
                                    <linearGradient id="nLogoGrad" x1="10" y1="4" x2="38" y2="44">
                                        <stop stopColor="#818CF8" />
                                        <stop offset="1" stopColor="#6366F1" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>
                        <h2>Join Meetup</h2>
                        <p className="name-entry-dest">
                            📍 {session.destination.name}
                        </p>
                    </div>
                    <div className="name-entry-body">
                        <label className="name-entry-label">What's your name?</label>
                        <div className="input-wrapper">
                            <span className="input-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            </span>
                            <input
                                id="join-name-input"
                                type="text"
                                placeholder="Enter your name"
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                                autoFocus
                                autoComplete="off"
                            />
                        </div>
                        <button
                            className="create-button"
                            onClick={handleJoin}
                            disabled={!nameInput.trim()}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                            </svg>
                            Join Meetup
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="meetup-page">
            {/* Map takes full background */}
            <div className="map-wrapper">
                <MapView
                    destination={session.destination}
                    participants={participants}
                    mySocketId={mySocketId}
                />
            </div>

            {/* Top bar overlay */}
            <div className="meetup-topbar">
                <div className="topbar-left">
                    <a href="/" className="topbar-logo">
                        <svg viewBox="0 0 48 48" width="28" height="28" fill="none">
                            <path d="M24 4C16.27 4 10 10.27 10 18c0 10.5 14 26 14 26s14-15.5 14-26c0-7.73-6.27-14-14-14z"
                                fill="url(#tLogoGrad)" stroke="white" strokeWidth="1.5" />
                            <circle cx="24" cy="18" r="6" fill="white" opacity="0.9" />
                            <defs>
                                <linearGradient id="tLogoGrad" x1="10" y1="4" x2="38" y2="44">
                                    <stop stopColor="#818CF8" />
                                    <stop offset="1" stopColor="#6366F1" />
                                </linearGradient>
                            </defs>
                        </svg>
                        Huddle
                    </a>
                </div>
                <div className="topbar-center">
                    <span className="dest-badge">
                        📍 {session.destination.name}
                    </span>
                </div>
                <div className="topbar-right">
                    <button className="topbar-btn" onClick={handleCopyLink} title="Copy meetup link">
                        {copied ? '✓ Copied!' : '🔗 Share Link'}
                    </button>
                    <button
                        className="topbar-btn people-btn"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        👥 {participants.length}
                    </button>
                </div>
            </div>

            {/* Sidebar */}
            <div className={`meetup-sidebar ${sidebarOpen ? 'open' : ''}`}>
                {/* Drag handle specifically for mobile */}
                <div className="sidebar-handle" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <div className="handle-bar"></div>
                </div>

                {identity && (
                    <div className="identity-card">
                        <div className="identity-avatar" style={{ background: identity.color }}>
                            {identity.name?.charAt(0)}
                        </div>
                        <div className="identity-info">
                            <span className="identity-name">{identity.name}</span>
                            <span className={`identity-status ${isConnected ? 'connected' : ''}`}>
                                <span className="status-dot"></span>
                                {isConnected ? 'Connected' : 'Connecting...'}
                            </span>
                        </div>
                    </div>
                )}

                {/* Location sharing toggle */}
                <div className="location-control">
                    {!isTracking ? (
                        <button className="share-location-btn" onClick={startTracking}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z" />
                                <circle cx="12" cy="9" r="2.5" />
                            </svg>
                            Share My Location
                        </button>
                    ) : (
                        <button className="stop-location-btn" onClick={stopTracking}>
                            <span className="pulse-dot"></span>
                            Sharing Location...
                        </button>
                    )}
                    {geoError && <p className="geo-error">{geoError}</p>}
                </div>

                {/* Navigation buttons */}
                <div className="nav-buttons">
                    <p className="nav-label">Get Directions</p>
                    <div className="nav-btn-row">
                        <button className="nav-btn google-maps-btn" onClick={openGoogleMaps}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C7.589 2 4 5.589 4 9.995 4 15.4 12 22 12 22s8-6.6 8-12.005C20 5.589 16.411 2 12 2z" fill="#EA4335" />
                                <circle cx="12" cy="10" r="3" fill="white" />
                            </svg>
                            Google Maps
                        </button>
                        <button className="nav-btn apple-maps-btn" onClick={openAppleMaps}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C7.589 2 4 5.589 4 9.995 4 15.4 12 22 12 22s8-6.6 8-12.005C20 5.589 16.411 2 12 2z" fill="#007AFF" />
                                <circle cx="12" cy="10" r="3" fill="white" />
                            </svg>
                            Apple Maps
                        </button>
                    </div>
                    {isTracking && (
                        <p className="nav-hint">💡 Your location keeps updating here even while navigating!</p>
                    )}
                </div>

                <ParticipantList
                    participants={participants}
                    mySocketId={mySocketId}
                    identity={identity}
                />
            </div>

            {/* Connection status toast */}
            {socketError && (
                <div className="toast error-toast">{socketError}</div>
            )}
        </div>
    );
}
