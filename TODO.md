# TODO - Realtime Collaboration Pro Upgrade

## Plan (approved)
1. Replace current whole-document overwrite sync with Yjs CRDT sync.
2. Update client editor to use Yjs-backed text instead of sending full textarea value.
3. Update socket server handlers to relay/persist Yjs updates per document.
4. Harden socket handlers to trust JWT user id (ignore client userId fields).
5. Keep existing chat + presence working; optionally extend cursor later.
6. Update/align docs if they incorrectly claim CRDT before implementation.

## Progress
- [x] Step 1: Add Yjs dependencies (client + server)

- [x] Step 2: Implement server-side Yjs persistence/update relay
- [x] Step 3: Implement client-side Yjs binding in Editor component
- [x] Step 4: Update collaborationStore events and state handling

- [x] Step 5: Harden socket events payloads & remove userId trust

- [x] Step 5a: Fix client Buffer/base64 conversion for Yjs updates

- [x] Step 6: Run and verify basic multi-user collaboration manually
- [ ] Step 7: Update documentation


