import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useDocumentStore from '../store/documentStore';
import useCollaborationStore from '../store/collaborationStore';
import Editor from '../components/Editor';
import ActiveUsers from '../components/ActiveUsers';
import ChatPanel from '../components/ChatPanel';

function EditorPage() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { currentDocument, getDocument } = useDocumentStore();
  const { initSocket, joinDocument, disconnect, isConnected } = useCollaborationStore();
  const [loading, setLoading] = useState(true);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const loadDocument = async () => {
      try {
        await getDocument(documentId);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load document:', error);
        navigate('/dashboard');
      }
    };

    loadDocument();
  }, [documentId, getDocument, navigate]);

  useEffect(() => {
    if (token && user && currentDocument) {
      initSocket(token);
      joinDocument(documentId, user.id);
    }

    return () => {
      disconnect();
    };
  }, [token, user, currentDocument, documentId, initSocket, joinDocument, disconnect]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-600 text-xl">Loading document...</div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{currentDocument?.title}</h1>
            <p className={`text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>{isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
          </div>
          <button onClick={() => navigate('/dashboard')} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold">Back to Dashboard</button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex gap-4">
          <div className="flex-1">
            <Editor documentId={documentId} userId={user?.id} />
          </div>

          <div className="w-80 space-y-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Active Users</h2>
              <ActiveUsers />
            </div>

            <button onClick={() => setShowChat(!showChat)} className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">{showChat ? 'Close Chat' : 'Open Chat'}</button>

            {showChat && (
              <div className="bg-white rounded-lg shadow p-4">
                <ChatPanel userId={user?.id} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default EditorPage;
