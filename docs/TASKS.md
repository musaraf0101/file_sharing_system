# Project Tasks: Secure P2P File Sharing

This document breaks down the development of the P2P file sharing application into actionable tasks and phases. All implementations must adhere to the architecture defined in [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md).

## Phase 1: Project Setup & Foundations
**Goal:** Initialize the project environment for both server and client.

- [x] **1.1. Directory Structure**
  - [x] Create root directory with `server` and `client` folders.
  - [x] Initialize Git repository.
- [x] **1.2. Server Initialization (Node.js)**
  - [x] Initialize `package.json`.
  - [x] Install dependencies: `express`, `socket.io`, `cors`, `nodemon`, `dotenv`.
  - [x] Setup TypeScript configuration (if using TS) or basic ES6 setup.
  - [x] Create `server.js` (or `index.ts`) with a basic Express app listener.
- [x] **1.3. Client Initialization (React)**
  - [x] Initialize React app (Vite recommended).
  - [x] Install dependencies: `socket.io-client`, `simple-peer` (or `peerjs` if preferred), `react-router-dom`, `tailwindcss`, `lucide-react`.
  - [x] Setup TailwindCSS.
  - [x] Create basic folder structure: `components`, `hooks`, `context`, `pages`.

## Phase 2: Signaling Server (Backend)
**Goal:** Build the WebSocket server to handle room management and signaling.

- [x] **2.1. Basic Socket.IO Setup**
  - [x] Initialize `io` instance with CORS enabled.
  - [x] Handle `connection` and `disconnect` events.
- [x] **2.2. Room Management**
  - [x] Implement `create-room` event:
    - [x] Generate unique Room ID (if not provided).
    - [x] Store room state (in-memory Map).
    - [x] Verify room doesn't already exist.
  - [x] Implement `join-room` event:
    - [x] Check if room exists.
    - [x] Validate password (if implemented).
    - [x] Emit success/failure to client.
    - [x] Broadcast `user-joined` to existing peer in room.
- [x] **2.3. WebRTC Signaling Relay**
  - [x] Implement `offer` event: Relay SDP from sender to receiver.
  - [x] Implement `answer` event: Relay SDP from receiver to sender.
  - [x] Implement `ice-candidate` event: Relay network candidates.

## Phase 3: Frontend UI & Signaling Integration
**Goal:** Create the visual interface and connect it to the signaling server.

- [x] **3.1. Landing Page / Room Setup**
  - [x] **Create/Join Form:**
    - [x] Input for "Room ID" (auto-generate option).
    - [x] Input for "Password".
    - [x] "Create" and "Join" buttons.
  - [x] **Validation:** Ensure inputs are not empty.
- [x] **3.2. Signaling Hook**
  - [x] Create `useSocket` hook (or Context).
  - [x] Connect to backend on mount.
  - [x] Listen for `room-created`, `join-success`, `user-joined`.
  - [x] Handle connection errors.
- [x] **3.3. Room Interface (Waiting State)**
  - [x] Show "Waiting for peer..." status.
  - [x] Display Room ID and Password for sharing.

## Phase 4: WebRTC Implementation (P2P)
**Goal:** Establish a direct connection between two browsers.

- [x] **4.1. WebRTC Logic (Sender)**
  - [x] Trigger: When `user-joined` event is received.
  - [x] Action: Create `RTCPeerConnection`.
  - [x] Action: Create Data Channel (`file-transfer`).
  - [x] Action: Create Offer -> Set Local Desc -> Emit `offer` socket event.
- [x] **4.2. WebRTC Logic (Receiver)**
  - [x] Trigger: When `offer` socket event is received.
  - [x] Action: Create `RTCPeerConnection`.
  - [x] Action: Set Remote Desc -> Create Answer -> Set Local Desc -> Emit `answer` socket event.
  - [x] Listener: Handle `ondatachannel` event to receive the channel.
- [x] **4.3. ICE Candidate Handling**
  - [x] Listen for `ice-candidate` from `RTCPeerConnection`.
  - [x] Emit `ice-candidate` via socket.
  - [x] Receive remote `ice-candidate` and call `addIceCandidate`.
- [x] **4.4. Connection State UI**
  - [x] Update UI when `connectionState` changes to `connected`.
  - [x] Enable file upload button only when connected.

## Phase 5: File Transfer Logic
**Goal:** Send large files effectively over the data channel.

- [x] **5.1. File Input & Metadata**
  - [x] File Picker UI (Drag & drop or button).
  - [x] Read file metadata (Name, Size, Type).
  - [x] Send "Metadata Packet" over data channel first.
- [x] **5.2. Transmission (Sender)**
  - [x] **Chunking:** Read file in chunks (e.g., 16KB).
  - [x] **Buffering:** Monitor `bufferedAmount` property.
  - [x] **Loop:** Send chunk -> wait if buffer full -> send next.
  - [x] **Progress:** Update UI progress bar locally.
- [x] **5.3. Reception (Receiver)**
  - [x] **Storage:** Store incoming ArrayBuffers in an array (or easier: use `Blob` at the end).
  - [x] **Progress:** Calculate `%` received.
  - [x] **Reassembly:** On last chunk, create `Blob` -> Generate URL -> Trigger download.

## Phase 6: Polish & Security
**Goal:** Make it production-ready.

- [x] **6.1. Security**
  - [x] Hash password before sending (or on server).
  - [x] Add Room Expiry (Server-side timeout) - *Implemented implicit session expiry via socket disconnect*.
- [x] **6.2. Error Handling**
  - [x] Handle peer disconnection (reset state).
  - [x] Handle file transfer interruption.
- [x] **6.3. Visuals**
  - [x] Add animations for file transfer - *Added progress bar and pulse animations*.
  - [x] Mobile responsive layout check - *Verified via Tailwind responsive classes*.

## Future / Bonus
- [ ] **Resume Capability**: Track last received chunk index and request specific range.
- [ ] **TURN Server**: Configure free/paid TURN for better connectivity (e.g., Metered.ca, Twilio). 
