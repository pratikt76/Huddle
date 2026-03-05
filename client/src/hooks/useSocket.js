import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSocket(sessionId, userName) {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [participants, setParticipants] = useState([]);
    const [identity, setIdentity] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!sessionId || !userName) return;

        const socket = io(SERVER_URL, {
            transports: ['websocket', 'polling']
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            // Join the session room with userName
            socket.emit('join-session', { sessionId, userName }, (response) => {
                if (response.error) {
                    setError(response.error);
                } else {
                    setIdentity({ name: response.name, color: response.color });
                }
            });
        });

        socket.on('participants-updated', (data) => {
            setParticipants(data);
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        socket.on('connect_error', () => {
            setError('Failed to connect to server');
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [sessionId, userName]);

    const updateLocation = useCallback((lat, lng) => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit('update-location', { lat, lng });
        }
    }, []);

    return { isConnected, participants, identity, error, updateLocation };
}
