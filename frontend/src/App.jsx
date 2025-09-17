// frontend/src/App.jsx

import React, { useEffect, useState } from 'react';
import Chat from './components/Chat';
import './styles/Chat.scss';

function App() {
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    let sid = localStorage.getItem('sessionId');
    if (!sid) {
      sid = 'sess_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('sessionId', sid);
    }
    setSessionId(sid);
  }, []);

  if (!sessionId) return <div>Loading...</div>;

  return (
    <div className="app">
      <h1>Chatbot</h1>
      <Chat sessionId={sessionId} />
    </div>
  );
}

export default App;
