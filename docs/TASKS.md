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

- [ ] **2.1. Basic Socket.IO Setup**
  - [ ] Initialize `io` instance with CORS enabled.
  - [ ] Handle `connection` and `disconnect` events.
- [ ] **2.2. Room Management**
  - [ ] Implement `create-room` event:
    - [ ] Generate unique Room ID (if not provided).
    - [ ] Store room state (in-memory Map).
    - [ ] Verify room doesn't already exist.
  - [ ] Implement `join-room` event:
    - [ ] Check if room exists.
    - [ ] Validate password (if implemented).
    - [ ] Emit success/failure to client.
    - [ ] Broadcast `user-joined` to existing peer in room.
- [ ] **2.3. WebRTC Signaling Relay**
  - [ ] Implement `offer` event: Relay SDP from sender to receiver.
  - [ ] Implement `answer` event: Relay SDP from receiver to sender.
  - [ ] Implement `ice-candidate` event: Relay network candidates.

## Phase 3: Frontend UI & Signaling Integration
**Goal:** Create the visual interface and connect it to the signaling server.

- [ ] **3.1. Landing Page / Room Setup**
  - [ ] **Create/Join Form:**
    - [ ] Input for "Room ID" (auto-generate option).
    - [ ] Input for "Password".
    - [ ] "Create" and "Join" buttons.
  - [ ] **Validation:** Ensure inputs are not empty.
- [ ] **3.2. Signaling Hook**
  - [ ] Create `useSocket` hook (or Context).
  - [ ] Connect to backend on mount.
  - [ ] Listen for `room-created`, `join-success`, `user-joined`.
  - [ ] Handle connection errors.
- [ ] **3.3. Room Interface (Waiting State)**
  - [ ] Show "Waiting for peer..." status.
  - [ ] Display Room ID and Password for sharing.

## Phase 4: WebRTC Implementation (P2P)
**Goal:** Establish a direct connection between two browsers.

- [ ] **4.1. WebRTC Logic (Sender)**
  - [ ] Trigger: When `user-joined` event is received.
  - [ ] Action: Create `RTCPeerConnection`.
  - [ ] Action: Create Data Channel (`file-transfer`).
  - [ ] Action: Create Offer -> Set Local Desc -> Emit `offer` socket event.
- [ ] **4.2. WebRTC Logic (Receiver)**
  - [ ] Trigger: When `offer` socket event is received.
  - [ ] Action: Create `RTCPeerConnection`.
  - [ ] Action: Set Remote Desc -> Create Answer -> Set Local Desc -> Emit `answer` socket event.
  - [ ] Listener: Handle `ondatachannel` event to receive the channel.
- [ ] **4.3. ICE Candidate Handling**
  - [ ] Listen for `ice-candidate` from `RTCPeerConnection`.
  - [ ] Emit `ice-candidate` via socket.
  - [ ] Receive remote `ice-candidate` and call `addIceCandidate`.
- [ ] **4.4. Connection State UI**
  - [ ] Update UI when `connectionState` changes to `connected`.
  - [ ] Enable file upload button only when connected.

## Phase 5: File Transfer Logic
**Goal:** Send large files effectively over the data channel.

- [ ] **5.1. File Input & Metadata**
  - [ ] File Picker UI (Drag & drop or button).
  - [ ] Read file metadata (Name, Size, Type).
  - [ ] Send "Metadata Packet" over data channel first.
- [ ] **5.2. Transmission (Sender)**
  - [ ] **Chunking:** Read file in chunks (e.g., 16KB).
  - [ ] **Buffering:** Monitor `bufferedAmount` property.
  - [ ] **Loop:** Send chunk -> wait if buffer full -> send next.
  - [ ] **Progress:** Update UI progress bar locally.
- [ ] **5.3. Reception (Receiver)**
  - [ ] **Storage:** Store incoming ArrayBuffers in an array (or easier: use `Blob` at the end).
  - [ ] **Progress:** Calculate `%` received.
  - [ ] **Reassembly:** On last chunk, create `Blob` -> Generate URL -> Trigger download.

## Phase 6: Polish & Security
**Goal:** Make it production-ready.

- [ ] **6.1. Security**
  - [ ] Hash password before sending (or on server).
  - [ ] Add Room Expiry (Server-side timeout).
- [ ] **6.2. Error Handling**
  - [ ] Handle peer disconnection (reset state).
  - [ ] Handle file transfer interruption.
- [ ] **6.3. Visuals**
  - [ ] Add animations for file transfer.
  - [ ] Mobile responsive layout check.

## Future / Bonus
- [ ] **Resume Capability**: Track last received chunk index and request specific range.
- [ ] **TURN Server**: Configure free/paid TURN for better connectivity (e.g., Metered.ca, Twilio). 
