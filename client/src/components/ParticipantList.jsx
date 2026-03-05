export default function ParticipantList({ participants, mySocketId, identity }) {
    return (
        <div className="participant-list">
            <div className="participant-list-header">
                <h3>
                    <span className="header-icon">👥</span>
                    People
                    <span className="participant-count">{participants.length}</span>
                </h3>
            </div>
            <div className="participant-items">
                {participants.length === 0 && (
                    <div className="participant-empty">
                        <span className="empty-icon">🔗</span>
                        <p>Share the link to invite friends!</p>
                    </div>
                )}
                {participants.map((p) => {
                    const isMe = p.socketId === mySocketId;
                    const hasLocation = p.lat != null && p.lng != null;
                    return (
                        <div key={p.socketId} className={`participant-item ${isMe ? 'is-me' : ''}`}>
                            <div className="participant-avatar" style={{ background: p.color }}>
                                {p.name?.charAt(0)}
                            </div>
                            <div className="participant-info">
                                <span className="participant-name">
                                    {p.name}
                                    {isMe && <span className="you-badge">You</span>}
                                </span>
                                <span className={`participant-status ${hasLocation ? 'active' : 'waiting'}`}>
                                    <span className="status-dot"></span>
                                    {hasLocation ? 'Sharing location' : 'Waiting for location...'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
