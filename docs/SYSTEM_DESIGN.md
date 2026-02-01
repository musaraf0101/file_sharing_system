# System Design: Secure P2P File Sharing Application

## 1. Executive Summary
This document outlines the architectural design for a peer-to-peer (P2P) file sharing application. The system enables users to share large files directly between devices without storing data on an intermediary server. It leverages **WebRTC** for data transport and **WebSockets (Socket.IO)** for signaling and session management.

## 2. High-Level Architecture
The system follows a **Client-Server-Client** topology where the server acts purely as a signaling broker. Once a connection is established, data flows directly between clients (P2P).

```mermaid
graph TD
    subgraph "Client A (Sender)"
        UI_A[User Interface]
        WebRTC_A[WebRTC Manager]
        File_A[File Chunking Engine]
    end

    subgraph "Client B (Receiver)"
        UI_B[User Interface]
        WebRTC_B[WebRTC Manager]
        File_B[File Reassembly Engine]
    end

    subgraph "Infrastructure"
        Signal[Signaling Server (Node/Socket.IO)]
        STUN[STUN Server (Public)]
        TURN[TURN Server (Fallback)]
    end

    %% Signaling
    WebRTC_A -- "SDP / ICE Candidates" --> Signal
    Signal -- "SDP / ICE Candidates" --> WebRTC_B
    
    %% NAT Traversal
    WebRTC_A <--> STUN
    WebRTC_B <--> STUN
    
    %% Data Transfer
    WebRTC_A <== "Encrypted Data Channel (DTLS/SCTP)" ==> WebRTC_B
```

## 3. Core Components

### 3.1 Frontend Client (Web/Mobile)
Responsible for UI, file processing, and WebRTC logic.
- **UI Layer (React)**: Handles user interaction, room creation/joining forms, and file selection.
- **Signaling Service**: Manages the Socket.IO connection to the backend.
- **WebRTC Manager**: Handles the lifecycle of `RTCPeerConnection`, data channels, and ICE candidates.
- **File Processor**:
    - **Sender**: Reads files as `ArrayBuffers`, slices them into chunks (e.g., 16KB - 64KB), and queues them for transmission.
    - **Receiver**: Receives chunks, tracks progress, and stitches them back into a `Blob` for download.

### 3.2 Signaling Server (Backend)
A lightweight Node.js/Express server used *only* for connection setup.
- **Room Management**: Maps `RoomID` to connected socket IDs.
- **Authentication**: Validates room passwords (hashed).
- **Event Broker**: Relays WebRTC signaling messages (`offer`, `answer`, `ice-candidate`) between peers in a room.
- **Storage**: Ephemeral in-memory storage (Map/Redis) for active rooms. NO file storage.

## 4. Detailed Workflows

### 4.1 Connection Establishment (Signaling)
Establishing a P2P connection requires exchanging connection metadata (SDP) and network addresses (ICE Candidates) via the server.

```mermaid
sequenceDiagram
    participant Sender
    participant Server
    participant Receiver

    Note over Sender, Receiver: 1. Room Setup
    Sender->>Server: create-room (RoomID, Password)
    Server-->>Sender: room-created

    Receiver->>Server: join-room (RoomID, Password)
    Server->>Receiver: join-success
    Server->>Sender: user-joined

    Note over Sender, Receiver: 2. WebRTC Handshake
    Sender->>Sender: Create Offer
    Sender->>Server: send-offer (SDP)
    Server->>Receiver: receive-offer (SDP)
    
    Receiver->>Receiver: Set Remote Desc (Offer)
    Receiver->>Receiver: Create Answer
    Receiver->>Server: send-answer (SDP)
    Server->>Sender: receive-answer (SDP)
    Sender->>Sender: Set Remote Desc (Answer)

    Note over Sender, Receiver: 3. ICE Candidate Exchange
    Sender->>Server: send-candidate (ICE)
    Server->>Receiver: receive-candidate (ICE)
    Receiver->>Server: send-candidate (ICE)
    Server->>Sender: receive-candidate (ICE)

    Note over Sender, Receiver: 4. P2P Direct Connection Established
    Sender<->Receiver: Data Channel Open
```

### 4.2 File Transfer Protocol
WebRTC Data Channels are used for transfer. To handle large files reliably, we implement a customized chunking protocol over the data channel.

1.  **Metadata Packet**: Sender sends file info `(name, size, mimeType, totalChunks)`.
2.  **Chunk Transmission**: Sender loops through file slices and sends them.
3.  **Flow Control**: To prevent buffer overflow (backpressure), the sender pauses when `bufferedAmount` is high and resumes when low.
4.  **Progress Updates**: Receiver calculates `%` based on bytes received vs total size.
5.  **Completion**: Receiver merges chunks and triggers browser download.

## 5. Security Architecture

### 5.1 Transport Security
- **WebRTC Encryption**: All data sent over WebRTC is automatically encrypted using **DTLS** (Datagram Transport Layer Security) and **SRTP** (Secure Real-time Transport Protocol).
- **Signaling Security**: Socket.IO connection should run over **HTTPS/WSS** (TLS) to prevent eavesdropping on the handshake.

### 5.2 Application Security
- **Room Passwords**: Passwords protect rooms from unauthorized access.
- **Ephemeral State**: Rooms are destroyed automatically when peers disconnect; no metadata persists.
- **No Server Storage**: Privacy is guaranteed by design as the server never touches the file data.

## 6. Data Structures

### 6.1 Signaling Events (Socket.IO)
| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `create-room` | `{ roomId, password }` | Request to create a room. |
| `join-room` | `{ roomId, password }` | Request to join a room. |
| `offer` | `{ sdp, targetSocketId }` | WebRTC session description (Offer). |
| `answer` | `{ sdp, targetSocketId }` | WebRTC session description (Answer). |
| `ice-candidate` | `{ candidate, targetSocketId }` | Network connectivity candidate. |

### 6.2 Application State (Frontend)
```typescript
interface FileTransferState {
  status: 'IDLE' | 'CONNECTING' | 'TRANSFERRING' | 'COMPLETED' | 'ERROR';
  fileMeta: {
    name: string;
    size: number;
    type: string;
  } | null;
  progress: number; // 0-100
  receivedChunks: Array<ArrayBuffer>;
  throughput: number; // bytes per second
}
```

## 7. Scalability & Performance
- **STUN/TURN**: A STUN server is required for direct connections. A TURN server is needed for relaying traffic if clients are behind restrictive NATs/Firewalls (approx 10-20% of cases).
- **Chunk Size**: Optimization needed. Too small = high overhead. Too large = head-of-line blocking. Recommended: **16KB** for reliability or up to **64KB** if stable.
- **Browser Limits**: Large files (>500MB) stored in memory (`Blob`) may crash mobile browsers. **FileSystem API** or **StreamSaver.js** should be used for streaming directly to disk.

## 8. Technology Stack Selection
- **Runtime**: Node.js (Server), Browser (Client)
- **Language**: TypeScript (Recommended for robust typing of signaling messages)
- **Libs**: `socket.io` (Signaling), `simple-peer` (optional wrapper, or raw WebRTC API), `uuid` (Room IDs).
