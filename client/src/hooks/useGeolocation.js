import { useState, useEffect, useRef, useCallback } from 'react';

export function useGeolocation(onLocationUpdate) {
    const [position, setPosition] = useState(null);
    const [error, setError] = useState(null);
    const [isTracking, setIsTracking] = useState(false);
    const watchIdRef = useRef(null);
    const callbackRef = useRef(onLocationUpdate);

    // Keep callback ref updated
    useEffect(() => {
        callbackRef.current = onLocationUpdate;
    }, [onLocationUpdate]);

    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setIsTracking(true);
        setError(null);

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setPosition(coords);
                if (callbackRef.current) {
                    callbackRef.current(coords.lat, coords.lng);
                }
            },
            (err) => {
                switch (err.code) {
                    case err.PERMISSION_DENIED:
                        setError('Location permission denied. Please enable it in your browser settings.');
                        break;
                    case err.POSITION_UNAVAILABLE:
                        setError('Location information unavailable.');
                        break;
                    case err.TIMEOUT:
                        setError('Location request timed out.');
                        break;
                    default:
                        setError('An unknown error occurred.');
                }
                setIsTracking(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 1000
            }
        );
    }, []);

    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setIsTracking(false);
    }, []);

    // Re-sync location when tab becomes visible again (important for mobile users
    // who switch to Google/Apple Maps app and come back)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && isTracking && callbackRef.current) {
                // Force a single getCurrentPosition to immediately re-sync
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        setPosition(coords);
                        if (callbackRef.current) {
                            callbackRef.current(coords.lat, coords.lng);
                        }
                    },
                    () => { }, // Ignore errors for re-sync
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
                );
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isTracking]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (watchIdRef.current !== null) {
                navigator.geolocation.clearWatch(watchIdRef.current);
            }
        };
    }, []);

    return { position, error, isTracking, startTracking, stopTracking };
}
