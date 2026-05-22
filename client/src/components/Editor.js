import React, { useState, useRef, useEffect } from 'react';
import useCollaborationStore from '../store/collaborationStore';

function Editor({ documentId, userId }) {
  const editorRef = useRef(null);
  const { content, editDocument } = useCollaborationStore();
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    setLocalContent(content);
  }, [content]);

  const handleChange = (e) => {
    const newContent = e.target.value;
    const oldLength = localContent.length;
    const newLength = newContent.length;

    let change;
    if (newLength > oldLength) {
      const insertedText = newContent.substring(e.target.selectionStart - (newLength - oldLength), e.target.selectionStart);
      change = { type: 'insert', position: e.target.selectionStart - insertedText.length, value: insertedText };
    } else {
      change = { type: 'delete', position: e.target.selectionStart, length: oldLength - newLength };
    }

    setLocalContent(newContent);
    editDocument(change, userId);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <textarea ref={editorRef} value={localContent} onChange={handleChange} className="w-full h-96 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm" placeholder="Start typing..." />
      <p className="text-gray-500 text-sm mt-2">Characters: {localContent.length} | Words: {localContent.split(/\s+/).filter(w => w).length}</p>
    </div>
  );
}

export default Editor;
