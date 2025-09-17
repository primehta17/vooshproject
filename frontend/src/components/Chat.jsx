// frontend/src/components/Chat.jsx

import React, { useState, useEffect, useRef } from 'react';
import ChatInput from './ChatInput';
import '../styles/Chat.scss';

function Chat({ sessionId }) {
  const [messages, setMessages] = useState([]);  
  const [isLoading, setIsLoading] = useState(false);
  const sourceRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (text) => {
    // Add user message immediately
    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsLoading(true);

    // Abort any existing SSE
    if (sourceRef.current) {
      sourceRef.current.close();
    }

    // Fetch to initiate SSE connection
    // Note: fetch + SSE over POST is trickier with EventSource (EventSource only supports GET)
    // So either adapt backend to accept query params via GET for SSE OR use fetch streaming
    // Here, we use EventSource with query params (assuming backend supports GET with sessionId & message)
    const encodedMsg = encodeURIComponent(text);
    const url = `/api/chat/stream?sessionId=${sessionId}&message=${encodedMsg}`;

    const es = new EventSource(url);
    sourceRef.current = es;

    let assistantText = '';

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.delta) {
          assistantText += data.delta;
          // Update messages: temporarily show partial reply
          setMessages(prev => {
            const last = prev[prev.length - 1];
            if (last.role === 'assistant') {
              // replace last partial assistant message
              return [...prev.slice(0, prev.length -1), { role: 'assistant', text: assistantText }];
            } else {
              // add new assistant message
              return [...prev, { role: 'assistant', text: assistantText }];
            }
          });
        }
      } catch (err) {
        console.error('Error parsing SSE message', err);
      }
    };

    es.addEventListener('done', (event) => {
      // stream done event
      es.close();
      setIsLoading(false);
    });

    es.addEventListener('error', (event) => {
      console.error('SSE error', event);
      es.close();
      setIsLoading(false);
      // optionally add an error message
      setMessages(prev => [...prev, { role: 'assistant', text: '[Error receiving response]' }]);
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((m, idx) => (
          <div key={idx} className={`chat-message ${m.role}`}>
            <div className="chat-message__content">{m.text}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSend={handleSend} />
    </div>
  );
}

export default Chat;
