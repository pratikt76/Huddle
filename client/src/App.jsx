import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MeetupPage from './pages/MeetupPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/meetup/:sessionId" element={<MeetupPage />} />
      </Routes>
    </Router>
  );
}
