import React from 'react';
import useCollaborationStore from '../store/collaborationStore';

function ActiveUsers() {
  const { activeUsers } = useCollaborationStore();

  return (
    <div>
      {activeUsers.length === 0 ? (
        <p className="text-gray-600 text-sm">No active users</p>
      ) : (
        <ul className="space-y-2">
          {activeUsers.map((userId) => (
            <li key={userId} className="flex items-center gap-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="text-gray-700">{userId}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ActiveUsers;
