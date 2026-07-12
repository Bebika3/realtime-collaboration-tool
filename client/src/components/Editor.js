import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import useCollaborationStore from '../store/collaborationStore';

function Editor({ documentId, userId }) {
  const textareaRef = useRef(null);
  const ydocRef = useRef(null);
  const ytextRef = useRef(null);

  const { sendLocalUpdate, content, isConnected } = useCollaborationStore();

  // Local Yjs doc for this editor instance.
  const [localText, setLocalText] = useState(content);

  if (!ydocRef.current) {
    ydocRef.current = new Y.Doc();
    ytextRef.current = ydocRef.current.getText('content');
  }


  // Keep textarea in sync with Y.Text.
  useEffect(() => {
    const ytext = ytextRef.current;

    const updateLocalState = () => {
      const text = ytext.toString();
      setLocalText(text);
    };

    updateLocalState();
    ytext.observe(updateLocalState);

    return () => ytext.unobserve(updateLocalState);
  }, []);

  // Bootstrap/keep local Yjs state aligned with the store's materialized `content`.
  // (The store updates its `content` based on remote Yjs updates coming from the server.)
  useEffect(() => {
    const ytext = ytextRef.current;
    if (typeof content !== 'string') return;

    // If the incoming remote materialized content differs, replace local Yjs text.
    const current = ytext.toString();
    if (current === content) return;

    ytext.doc.transact(() => {
      ytext.delete(0, ytext.length);
      if (content.length > 0) ytext.insert(0, content);
    });
  }, [documentId, content]);


  // Listen to local Yjs changes and send updates to server.
  useEffect(() => {
    const ydoc = ydocRef.current;

    const handler = (update) => {
      sendLocalUpdate(documentId, update);
    };

    ydoc.on('update', handler);
    return () => {
      ydoc.off('update', handler);
    };
  }, [documentId, sendLocalUpdate]);

  const handleTextareaChange = (e) => {

    const value = e.target.value;
    const ytext = ytextRef.current;

    ytext.doc.transact(() => {
      ytext.delete(0, ytext.length);
      ytext.insert(0, value);
    });
  };

  const chars = localText.length;
  const words = useMemo(
    () => localText.split(/\s+/).filter((w) => w).length,
    [localText]
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <textarea
        ref={textareaRef}
        value={localText}
        onChange={handleTextareaChange}
        className="w-full h-96 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        placeholder={isConnected ? 'Start typing...' : 'Connecting to document...'}
      />
      <p className="text-gray-500 text-sm mt-2">
        Characters: {chars} | Words: {words}
      </p>
    </div>
  );
}

export default Editor;

