import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as Y from 'yjs';
import useCollaborationStore from '../store/collaborationStore';

function Editor({ documentId, userId }) {
  const textareaRef = useRef(null);
  const ydocRef = useRef(null);
  const ytextRef = useRef(null);

  const { getYjsDoc, sendLocalUpdate, content, isConnected } = useCollaborationStore();


  const [localText, setLocalText] = useState(content);

  // Create Yjs structures once per component mount.
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

  // Receive initial/remote content via store (server sends it by applying a persisted Yjs state).
  useEffect(() => {
    const ydoc = ydocRef.current;
    const ytext = ytextRef.current;

    // If store already has a materialized content string, initialize local Yjs text.
    // (Store keeps `content` updated for backwards compatibility and UI metrics.)
    if (typeof content === 'string' && ytext.length === 0 && content.length > 0) {
      ydoc.transact(() => {
        ytext.insert(0, content);
      });
    }

    // When store provides a Yjs doc, we can mirror its content into our local doc.
    const storeYDoc = getYjsDoc?.(documentId);
    if (storeYDoc && storeYDoc !== ydoc) {
      // Apply full state once for bootstrap; afterwards we rely on update events.
      const state = Y.encodeStateAsUpdate(storeYDoc);
      Y.applyUpdate(ydoc, state);
    }
  }, [documentId, content, getYjsDoc]);

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

  // Apply remote updates into Yjs doc.
  useEffect(() => {
    // Store will call applyRemoteUpdate when it receives updates from server.
    // This component just reflects Yjs text; no extra wiring needed here.
    void applyRemoteUpdate;
  }, [applyRemoteUpdate]);

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

