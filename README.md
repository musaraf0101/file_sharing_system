# Secure P2P File Sharing

A real-time, peer-to-peer file sharing application built with WebRTC, Socket.IO, and React. This project allows users to share large files directly between browsers without storing them on an intermediate server, ensuring privacy and speed.

## 🚀 Features

*   **P2P File Transfer**: Direct browser-to-browser transfer using WebRTC.
*   **Real-time Signaling**: Socket.IO for room management and connection handshakes.
*   **Secure Rooms**: Generate private rooms with passwords to share files securely.
*   **Modern UI**: Built with React, Vite, and TailwindCSS for a responsive and beautiful experience.
*   **No File Size Limits**: Since files stream directly between peers, you aren't restricted by server upload limits.

## 🛠️ Tech Stack

### Client (Frontend)
*   **Framework**: React (Vite)
*   **Styling**: TailwindCSS
*   **Real-time Communication**: Socket.IO Client
*   **WebRTC Handling**: simple-peer
*   **Icons**: Lucide React
*   **Routing**: React Router DOM

### Server (Backend)
*   **Runtime**: Node.js
*   **Framework**: Express
*   **Signaling**: Socket.IO
*   **Utilities**: Nodemon, Dotenv, CORS

## 📦 Installation & Setup

### Prerequisites
*   Node.js (v18+ recommended)
*   npm or yarn

### 1. Clone the Repository
```bash
git clone <repository_url>
cd file_share
```

### 2. Setup Server
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory (optional for now, defaults used).

### 3. Setup Client
```bash
cd client
npm install
```

## 🏃‍♂️ Running the Project

You need to run both the server and the client concurrently.

### 1. Start the Backend Server
```bash
# In the /server directory
npm run dev
```
*Server runs on port 5000 by default.*

### 2. Start the Frontend Application
```bash
# In the /client directory
npm run dev
```
*Client typically runs on http://localhost:5173*

## 📝 Project Structure

```
file_share/
├── client/         # React Frontend
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── pages/
│   └── ...
├── server/         # Node.js Signaling Server
│   ├── server.js
│   └── ...
└── docs/           # Documentation & Tasks
    ├── TASKS.md
    └── SYSTEM_DESIGN.md
```

## 🤝 Contributing
1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
