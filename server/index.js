require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { generateName } = require('./names');
const store = require('./store');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST']
    }
});

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

// Participant colors palette
const COLORS = [
    '#6C5CE7', '#00B894', '#E17055', '#0984E3',
    '#E84393', '#00CEC9', '#FDCB6E', '#D63031',
    '#A29BFE', '#55EFC4', '#FAB1A0', '#74B9FF',
    '#FD79A8', '#81ECEC', '#FFEAA7', '#FF7675'
];

// ---------- REST ROUTES ----------

app.post('/create-session', (req, res) => {
    const { destination } = req.body;
    if (!destination || !destination.name || destination.lat == null || destination.lng == null) {
        return res.status(400).json({ error: 'destination with name, lat, lng is required' });
    }

    const sessionId = uuidv4().slice(0, 8);
    const session = store.createSession(sessionId, destination);
    res.json({ sessionId: session.id });
});

app.get('/session/:id', (req, res) => {
    const session = store.getSession(req.params.id);
    if (!session) {
        return res.status(404).json({ error: 'Session not found or expired' });
    }
    res.json(store.serializeSession(session));
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});

// ---------- SOCKET.IO EVENTS ----------

// Track which session each socket is in
const socketSessions = new Map();

io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    socket.on('join-session', ({ sessionId, userName }, callback) => {
        const session = store.getSession(sessionId);
        if (!session) {
            if (callback) callback({ error: 'Session not found' });
            return;
        }

        // Use provided name or generate a random one
        const existingNames = store.getParticipants(sessionId).map(p => p.name);
        let name = userName?.trim();
        if (!name) {
            name = generateName(existingNames);
        }
        // If name already exists, append a number
        if (existingNames.includes(name)) {
            let counter = 2;
            while (existingNames.includes(`${name} (${counter})`)) counter++;
            name = `${name} (${counter})`;
        }
        const colorIndex = session.participants.size % COLORS.length;
        const color = COLORS[colorIndex];

        store.addParticipant(sessionId, socket.id, {
            name,
            color,
            lat: null,
            lng: null
        });

        socket.join(sessionId);
        socketSessions.set(socket.id, sessionId);

        console.log(`[Socket] ${name} joined session ${sessionId}`);

        // Send back assigned identity
        if (callback) callback({ name, color });

        // Broadcast updated participants to everyone in room
        io.to(sessionId).emit('participants-updated', store.getParticipants(sessionId));
    });

    socket.on('update-location', ({ lat, lng }) => {
        const sessionId = socketSessions.get(socket.id);
        if (!sessionId) return;

        store.updateParticipantLocation(sessionId, socket.id, lat, lng);

        // Broadcast to everyone in the room
        io.to(sessionId).emit('participants-updated', store.getParticipants(sessionId));
    });

    socket.on('disconnect', () => {
        const sessionId = socketSessions.get(socket.id);
        if (sessionId) {
            const session = store.getSession(sessionId);
            if (session) {
                const participant = session.participants.get(socket.id);
                if (participant) {
                    console.log(`[Socket] ${participant.name} left session ${sessionId}`);
                }
                store.removeParticipant(sessionId, socket.id);
                io.to(sessionId).emit('participants-updated', store.getParticipants(sessionId));
            }
            socketSessions.delete(socket.id);
        }
        console.log(`[Socket] Disconnected: ${socket.id}`);
    });
});

// ---------- START ----------

server.listen(PORT, () => {
    console.log(`\n🟢 Huddle server running on http://localhost:${PORT}\n`);
});
