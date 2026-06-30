import { useState } from 'react';
import Lobby from './components/Lobby';
import Login from './components/Login';
import StudentDash from './components/StudentDash';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('lobby');

  return (
    <div className="min-h-screen font-sans bg-bg text-textMain transition-colors duration-300">
      {currentView === 'lobby' && <Lobby onNavigate={setCurrentView} />}
      {currentView === 'login-student' && <Login role="student" onNavigate={setCurrentView} />}
      {currentView === 'login-staff' && <Login role="staff" onNavigate={setCurrentView} />}
      {currentView === 'student-dash' && <StudentDash onNavigate={setCurrentView} />}
    </div>
  );
}

export default App;
