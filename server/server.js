import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { DBConnection } from "./src/config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST","PUT","DELETE","PATCH","OPTIONS"],
  },
});

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
  }),
);

DBConnection();

// In-memory store for room state
// Key: roomId, Value: { password: string | null }
const rooms = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 2.2 Room Management

  // Handle Create Room
  socket.on("create-room", ({ roomId, password }, callback) => {
    // Generate Room ID if not provided
    if (!roomId) {
        roomId = Math.random().toString(36).substring(2, 9);
    }

    if (rooms.has(roomId)) {
      return callback({ success: false, message: "Room already exists" });
    }

    // Store room details
    rooms.set(roomId, { password });
    socket.join(roomId);
    
    console.log(`Room created: ${roomId} by ${socket.id}`);
    callback({ success: true, roomId });
  });

  // Handle Join Room
  socket.on("join-room", ({ roomId, password }, callback) => {
    if (!rooms.has(roomId)) {
      return callback({ success: false, message: "Room does not exist" });
    }

    const room = rooms.get(roomId);

    // Verify Password (if room has one)
    if (room.password && room.password !== password) {
      return callback({ success: false, message: "Incorrect password" });
    }

    // Check room occupancy (optional: limit to 2 peers for P2P)
    const clients = io.sockets.adapter.rooms.get(roomId);
    if (clients && clients.size >= 2) {
       return callback({ success: false, message: "Room is full" });
    }

    socket.join(roomId);
    console.log(`User ${socket.id} joined room ${roomId}`);
    
    // Notify existing peer(s) in the room
    // For P2P, we usually expect one other person
    socket.to(roomId).emit("user-joined", { userId: socket.id });

    callback({ success: true, roomId });
  });

  // 2.3 WebRTC Signaling Relay

  // Relay Offer
  socket.on("offer", ({ roomId, offer }) => {
    // Broadcast to everyone else in the room (should be just the receiver)
    socket.to(roomId).emit("offer", { senderId: socket.id, offer });
  });

  // Relay Answer
  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", { senderId: socket.id, answer });
  });

  // Relay ICE Candidate
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { senderId: socket.id, candidate });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Find rooms where user was present and notify others
    // Since we track rooms in socket.io adapter, we can iterate
    // However, socket.rooms is cleared on disconnect.
    // We need to loop our custom 'rooms' map or just rely on 'disconnecting' event if needed.
    // But simplifying:
    // We can rely on standard socket.io room notifications if we tracked them, 
    // but here we didn't track user->room mapping extensively.
    
    // Quick fix: Loop through all rooms and emit user-left to them if we can't easily track.
    // Better: use 'disconnecting' event which still has access to socket.rooms
  });

  socket.on("disconnecting", () => {
      const roomsIter = socket.rooms;
      for (const room of roomsIter) {
          if (room !== socket.id) {
              socket.to(room).emit("user-left", { userId: socket.id });
          }
      }
  });
});

httpServer.listen(5000, () => {
  console.log("Server started on port 5000");
});

export default app;
