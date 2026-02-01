import express from "express";
import cors from "cors";
import path from "path";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  },
});

app.use(express.json());
app.use(
  cors(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    }),
  ),
);

// In-memory store for room state
const rooms = new Map();

io.on("connection", (socket) => {
  // Handle Create Room
  socket.on("create-room", ({ roomId, password }, callback) => {
    if (!roomId) {
      roomId = Math.random().toString(36).substring(2, 9);
    }

    if (rooms.has(roomId)) {
      return callback({ success: false, message: "Room already exists" });
    }
    // Store room details
    rooms.set(roomId, { password });
    socket.join(roomId);
    callback({ success: true, roomId });
  });

  // Handle Join Room
  socket.on("join-room", ({ roomId, password }, callback) => {
    const room = rooms.get(roomId);

    if (!room) {
      return callback({ success: false, message: "Room does not exist" });
    }
    // Verify Password (if room has one)
    if (room.password && room.password !== password) {
      return callback({ success: false, message: "Incorrect password" });
    }
    // Check room occupancy (optional: limit to 2 peers for P2P)
    const clients = io.sockets.adapter.rooms.get(roomId);
    if (clients && clients.size >= 2) {
      return callback({ success: false, message: "Room is full" });
    }
    // Join room
    socket.join(roomId);
    // Notify other users in the room
    socket.to(roomId).emit("user-joined", { userId: socket.id });
    callback({ success: true, roomId });
  });

  // WebRTC Signaling Relay
  socket.on("offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("offer", { senderId: socket.id, offer });
  });
  // Handle Answer
  socket.on("answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("answer", { senderId: socket.id, answer });
  });
  // Handle Ice Candidate
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("ice-candidate", { senderId: socket.id, candidate });
  });
  // Handle User Left
  socket.on("disconnecting", () => {
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.to(room).emit("user-left", { userId: socket.id });
      }
    });
  });
});

// Health check route (recommended)
app.get("/", (req, res) => {
  res.json({ status: "Backend running 🚀" });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
