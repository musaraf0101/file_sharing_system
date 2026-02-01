import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useSocketContext } from "../context/SocketContext";
import { Upload, Download, ArrowRight, Shield, Zap, Globe } from "lucide-react";
import toast from "react-hot-toast";

const LandingPage = () => {
  const navigate = useNavigate();
  const { socket } = useSocketContext();
  const [roomId, setRoomId] = useState("");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(true);

  const hashPassword = async (pwd) => {
    if (!pwd) return null;
    const encoder = new TextEncoder();
    const data = encoder.encode(pwd);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!socket) return toast.error("Not connected to server");
    
    const hashedPassword = await hashPassword(password);

    socket.emit("create-room", { roomId, password: hashedPassword }, (response) => {
      if (response.success) {
        toast.success("Room created successfully!");
        navigate(`/room/${response.roomId}`);
      } else {
        toast.error(response.message || "Failed to create room");
      }
    });
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!socket) return toast.error("Not connected to server");
    if (!roomId) return toast.error("Room ID is required to join");

    const hashedPassword = await hashPassword(password);

    socket.emit("join-room", { roomId, password: hashedPassword }, (response) => {
      if (response.success) {
        toast.success("Joined room successfully!");
        navigate(`/room/${response.roomId}`);
      } else {
        toast.error(response.message || "Failed to join room");
      }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white flex flex-col items-center justify-center p-4">
      
      {/* Hero Section */}
      <div className="text-center mb-12 animate-fade-in-down">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
          Secure P2P Share
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Direct, encrypted, and limitless file sharing directly between browsers. No servers, no logs, no limits.
        </p>
      </div>

      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden p-8 animate-fade-in-up delay-100">
        
        {/* Toggle Tabs */}
        <div className="flex mb-8 bg-gray-800/50 rounded-lg p-1">
          <button
            onClick={() => setIsCreating(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
              isCreating
                ? "bg-blue-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => setIsCreating(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-300 ${
              !isCreating
                ? "bg-purple-600 text-white shadow-lg"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Join Room
          </button>
        </div>

        {/* Form */}
        <form onSubmit={isCreating ? handleCreateRoom : handleJoinRoom} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room ID {isCreating && <span className="text-xs text-gray-500">(Optional - Auto-generated if empty)</span>}
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder={isCreating ? "e.g., my-secure-room" : "Enter Room ID"}
              className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password <span className="text-xs text-gray-500">(Optional)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-800/50 border border-gray-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all placeholder-gray-600"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 ${
              isCreating
                ? "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400"
                : "bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400"
            }`}
          >
            {isCreating ? (
              <>
                Create Room <ArrowRight size={20} />
              </>
            ) : (
              <>
                Join Room <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 max-w-4xl text-center">
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400">
                <Shield size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">End-to-End Encrypted</h3>
            <p className="text-sm text-gray-400">Files never touch our servers. Transfers happen directly between devices.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-400">
                <Zap size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">Blazing Fast</h3>
            <p className="text-sm text-gray-400">P2P connection means no bandwidth bottlenecks. Speed is limited only by your network.</p>
        </div>
        <div className="p-6 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
            <div className="w-12 h-12 bg-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-pink-400">
                <Globe size={24} />
            </div>
            <h3 className="font-bold text-lg mb-2">No Restrictions</h3>
            <p className="text-sm text-gray-400">Share files of any size or type. No arbitrary limits on your transfers.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
