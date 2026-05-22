import React, { useState, useRef, useEffect } from 'react';
import useCollaborationStore from '../store/collaborationStore';

function ChatPanel({ userId }) {
  const [message, setMessage] = useState('');
  const { chatMessages, sendChatMessage } = useCollaborationStore();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    sendChatMessage(userId, message);
    setMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto mb-4 space-y-2 max-h-64">
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={`text-sm ${msg.userId === userId ? 'text-right' : 'text-left'}`}>
            <span className="font-semibold text-gray-700">{msg.userId}:</span>
            <p className={`inline-block px-3 py-1 rounded-lg ${msg.userId === userId ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>{msg.message}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm">Send</button>
      </form>
    </div>
  );
}

export default ChatPanel;
