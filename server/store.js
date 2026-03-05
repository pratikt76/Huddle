// In-memory session store
const sessions = new Map();
const sessionTimers = new Map();

const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours

function createSession(id, destination) {
    const session = {
        id,
        destination, // { name, lat, lng }
        participants: new Map(), // socketId -> { name, lat, lng, color }
        createdAt: Date.now()
    };
    sessions.set(id, session);

    // Auto-delete after 24 hours
    const timer = setTimeout(() => {
        sessions.delete(id);
        sessionTimers.delete(id);
    }, SESSION_TTL);
    sessionTimers.set(id, timer);

    return session;
}

function getSession(id) {
    return sessions.get(id) || null;
}

function deleteSession(id) {
    const timer = sessionTimers.get(id);
    if (timer) clearTimeout(timer);
    sessionTimers.delete(id);
    sessions.delete(id);
}

function addParticipant(sessionId, socketId, participant) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    session.participants.set(socketId, participant);
    return session;
}

function updateParticipantLocation(sessionId, socketId, lat, lng) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    const participant = session.participants.get(socketId);
    if (!participant) return null;
    participant.lat = lat;
    participant.lng = lng;
    return session;
}

function removeParticipant(sessionId, socketId) {
    const session = sessions.get(sessionId);
    if (!session) return null;
    session.participants.delete(socketId);
    return session;
}

function getParticipants(sessionId) {
    const session = sessions.get(sessionId);
    if (!session) return [];
    return Array.from(session.participants.entries()).map(([socketId, data]) => ({
        socketId,
        ...data
    }));
}

function serializeSession(session) {
    if (!session) return null;
    return {
        id: session.id,
        destination: session.destination,
        participants: getParticipants(session.id),
        createdAt: session.createdAt
    };
}

module.exports = {
    createSession,
    getSession,
    deleteSession,
    addParticipant,
    updateParticipantLocation,
    removeParticipant,
    getParticipants,
    serializeSession
};
