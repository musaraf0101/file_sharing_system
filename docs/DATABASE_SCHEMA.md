# Database Schema Design (MongoDB)

This document defines the data models for the P2P File Sharing Application, adapted for a **MongoDB (NoSQL)** architecture.

Since the core philosophy of this application is **No Server-Side File Storage** and privacy, the primary usage of MongoDB will be for:
1.  **Ephemeral Session State** (Active Rooms) - *If not using Redis*.
2.  **Persistent History/Analytics** (Optional) - For "Premium" features or usage logs.

---

## 1. Operational Data: Active Rooms
**Collection:** `rooms`
**Purpose:** Manage active signaling sessions.
**TTL Index:** This collection should have a TTL (Time-To-Live) index on `createdAt` or `expiresAt` to automatically delete old rooms.

### 1.1. Schema Model
```javascript
const RoomSchema = new mongoose.Schema({
  roomId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  passwordHash: { 
    type: String, 
    required: false // Optional if rooms can be public
  },
  ownerSocketId: { 
    type: String, 
    required: true 
  },
  peers: [{ 
    type: String // Array of connected socket IDs
  }],
  status: { 
    type: String, 
    enum: ['WAITING', 'FULL', 'TRANSFERRING'],
    default: 'WAITING'
  },
  createdAt: { 
    type: Date, 
    default: Date.now,
    expires: 86400 // TTL: Automatically delete doc after 24 hours (86400 seconds)
  }
});
```

### 1.2. Access Patterns
*   **Create Room:** `db.rooms.insertOne({ ... })`
*   **Find Room:** `db.rooms.findOne({ roomId: "xyz-123" })`
*   **Join Room (Update):** `db.rooms.updateOne({ roomId: "..." }, { $push: { peers: "socket_id" } })`
*   **Clean Up:** Handled automatically by MongoDB TTL index.

---

## 2. Persistent Data: Transfer Logs (Optional)
**Collection:** `transfer_logs`
**Purpose:** Store metadata statistics for history and analytics. **No file content is stored.**

### 2.1. Schema Model
```javascript
const TransferLogSchema = new mongoose.Schema({
  // Link to a registered user if applicable
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false 
  },
  meta: {
    fileNameHash: String, // SHA-256 hash of filename for privacy
    fileType: String,     // e.g., 'video/mp4'
    fileSizeBytes: Number // Size in bytes
  },
  session: {
    roomId: String,
    senderIpHash: String, // Anonymized IP hash
    startedAt: { type: Date, default: Date.now },
    completedAt: Date
  },
  status: { 
    type: String, 
    enum: ['COMPLETED', 'FAILED', 'CANCELLED'],
    required: true
  }
});

// Index for querying specific user history
TransferLogSchema.index({ userId: 1, 'session.startedAt': -1 });
```

---

## 3. Persistent Data: Users (Optional)
**Collection:** `users`
**Purpose:** User accounts for premium features.

### 3.1. Schema Model
```javascript
const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  passwordHash: { 
    type: String, 
    required: true 
  },
  isPremium: { 
    type: Boolean, 
    default: false 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});
```

---

## 4. Data Privacy & Security Principles

1.  **Zero Knowledge:** The database **NEVER** stores raw filenames or file contents.
2.  **TTL Indexes:** Essential for the `rooms` collection to prevent database bloat and ensure privacy by deleting old session data automatically.
3.  **Atomic Updates:** Use Mongo's `$push` and `$pull` operators to manage peer lists in real-time without race conditions.
