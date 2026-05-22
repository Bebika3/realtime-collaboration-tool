import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useDocumentStore from '../store/documentStore';

function DashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { documents, fetchDocuments, createDocument, deleteDocument, loading } = useDocumentStore();
  const [newDocTitle, setNewDocTitle] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleCreateDocument = async (e) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    try {
      const doc = await createDocument(newDocTitle);
      setNewDocTitle('');
      setShowCreateForm(false);
      navigate(`/editor/${doc._id}`);
    } catch (error) {
      console.error('Failed to create document:', error);
    }
  };

  const handleDeleteDocument = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await deleteDocument(id);
      } catch (error) {
        console.error('Failed to delete document:', error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Documents</h1>
            <p className="text-gray-600 mt-2">Welcome, {user?.name}</p>
          </div>
          <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold">Logout</button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          {!showCreateForm ? (
            <button onClick={() => setShowCreateForm(true)} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold">+ Create New Document</button>
          ) : (
            <form onSubmit={handleCreateDocument} className="bg-white p-6 rounded-lg shadow">
              <input type="text" placeholder="Document title..." value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
              <div className="flex gap-2">
                <button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-50">Create</button>
                <button type="button" onClick={() => setShowCreateForm(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-lg font-semibold">Cancel</button>
              </div>
            </form>
          )}
        </div>

        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <p className="text-xl">No documents yet. Create one to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <div key={doc._id} className="bg-white rounded-lg shadow hover:shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{doc.title}</h3>
                <p className="text-gray-600 text-sm mb-4">Last modified: {new Date(doc.lastModified).toLocaleDateString()}</p>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/editor/${doc._id}`)} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold">Open</button>
                  <button onClick={() => handleDeleteDocument(doc._id)} className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-semibold">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardPage;
