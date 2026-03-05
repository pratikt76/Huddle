# 📍 Huddle

Real-time group location sharing web app. Create a meetup, share a link, and see everyone live on a map — no login required.

![Huddle](https://img.shields.io/badge/Huddle-Live%20Location%20Sharing-6366F1?style=for-the-badge)

## Features

- 🗺️ **Live Map** — See everyone's location updating in real-time on a dark-themed Leaflet map
- 🔗 **Shareable Links** — Create a meetup and share the link with friends
- 🚫 **No Login** — Just enter your name and join
- 📍 **Navigation** — Open directions in Google Maps or Apple Maps
- 🔄 **Real-time** — Socket.io powered live location broadcasting
- ⏰ **Auto-expiry** — Sessions auto-delete after 24 hours
- 📱 **Responsive** — Works on desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite) |
| Backend | Node.js + Express |
| Real-time | Socket.io |
| Maps | Leaflet.js + OpenStreetMap |
| Geocoding | Nominatim (free) |
| Storage | In-memory (Map) |

## Project Structure

```
Huddle/
├── client/          # React frontend (Vite)
│   ├── src/
│   │   ├── components/   # Map, ParticipantList
│   │   ├── hooks/        # useSocket, useGeolocation
│   │   ├── pages/        # HomePage, MeetupPage
│   │   └── utils/        # parseMapLink
│   └── package.json
├── server/          # Express + Socket.io backend
│   ├── index.js     # Server entry point
│   ├── store.js     # In-memory session store
│   ├── names.js     # Random name generator
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 18+

### Install & Run

```bash
# Backend
cd server
npm install
node index.js

# Frontend (in a new terminal)
cd client
npm install
npm run dev
```

The app will be available at `http://localhost:5173`

## Deployment

- **Frontend**: Deploy `client/` to Vercel
- **Backend**: Deploy `server/` to Railway, Render, or any Node.js host
- Set `VITE_SERVER_URL` env var in the frontend to point to your deployed backend
- Set `CLIENT_URL` env var in the backend to allow CORS from your frontend domain

## License

MIT
