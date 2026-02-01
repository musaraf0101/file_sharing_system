import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocketContext } from "../context/SocketContext";
import { useWebRTC } from "../hooks/useWebRTC";
import { Copy, Users, FileText, ArrowLeft, Wifi, CheckCircle, Loader } from "lucide-react";
import toast from "react-hot-toast";

const RoomPage = () => {
    const { roomId } = useParams();
    const { socket } = useSocketContext();
    const navigate = useNavigate();
    const [peers, setPeers] = useState([]);
    
    // Phase 4: WebRTC Integration
    // Phase 5: File Transfer Integration
    const { connectionState, sendFile, transferProgress, isTransferring } = useWebRTC(roomId);
    
    const [selectedFile, setSelectedFile] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleSendFile = () => {
        if (selectedFile) {
            sendFile(selectedFile);
        } else {
            toast.error("Please select a file first");
        }
    };

    useEffect(() => {
        if (!socket) return;
        
        socket.on("user-joined", ({ userId }) => {
            console.log("User joined:", userId);
            setPeers((prev) => [...prev, userId]);
            // toast handled in useWebRTC for connection
        });

        // Also listen for existing peers if we joined any (though for P2P it's usually 1:1 trigger)
        // For now, simple peer list purely visual
        
        return () => {
            socket.off("user-joined");
        };
    }, [socket, roomId]);

    const copyRoomId = () => {
        navigator.clipboard.writeText(roomId);
        toast.success("Room ID copied to clipboard!");
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="flex items-center justify-between mb-8 pb-6 border-b border-gray-800">
                    <button 
                        onClick={() => navigate('/')}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Leave Room</span>
                    </button>
                    <div className="flex items-center gap-4 bg-gray-800/50 px-4 py-2 rounded-full border border-gray-700">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-mono text-gray-300">ID: {roomId}</span>
                        <button 
                            onClick={copyRoomId}
                            className="p-1 hover:bg-gray-700 rounded transition-colors"
                        >
                            <Copy size={16} />
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Main Area: File Transfer / Waiting State */}
                    <div className="lg:col-span-2">
                        {connectionState !== 'connected' ? (
                            <div className="bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-700 h-[60vh] flex flex-col items-center justify-center text-center p-8 transition-all">
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${connectionState === 'connecting' || connectionState === 'new' ? 'bg-yellow-500/10' : 'bg-blue-500/10'} animate-pulse`}>
                                    {connectionState === 'connecting' || connectionState === 'new' ? (
                                        <Loader size={40} className="text-yellow-500 animate-spin" />
                                    ) : (
                                        <Wifi size={40} className="text-blue-500" />
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold mb-2">
                                    {connectionState === 'connecting' || connectionState === 'new' ? 'Establishing Secure Connection...' : 'Waiting for Peer...'}
                                </h2>
                                <p className="text-gray-400 max-w-md">
                                    {connectionState === 'connecting' 
                                        ? "Performing Handshake (ICE/SDP)..." 
                                        : "Share the Room ID with a friend to establish a secure P2P connection."}
                                </p>
                            </div>
                        ) : (
                            <div className="bg-gray-800/30 rounded-3xl border border-green-500/30 h-[60vh] flex flex-col items-center justify-center text-center p-8 transition-all animate-fade-in-up relative overflow-hidden">
                                {isTransferring ? (
                                    <div className="w-full max-w-md">
                                        <div className="flex items-center justify-center mb-8">
                                            <div className="relative">
                                                <div className="w-32 h-32 rounded-full border-4 border-blue-500/30 flex items-center justify-center animate-pulse">
                                                    <FileText size={48} className="text-blue-400" />
                                                </div>
                                                <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-t-blue-500 border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2">Transferring File...</h2>
                                        <p className="text-gray-400 mb-6">{transferProgress}% Completed</p>
                                        
                                        <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 ease-out"
                                                style={{ width: `${transferProgress}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                                            <CheckCircle size={40} className="text-green-500" />
                                        </div>
                                        <h2 className="text-2xl font-bold mb-4">Peer Connected!</h2>
                                        <p className="text-green-400 mb-8">Secure P2P connection established via WebRTC.</p>
                                        
                                        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                                            <label className="w-full cursor-pointer">
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={handleFileChange}
                                                />
                                                <div className="w-full py-4 border-2 border-dashed border-gray-600 hover:border-blue-500 bg-gray-800/50 hover:bg-gray-800 rounded-xl flex flex-col items-center transition-all group">
                                                    <FileText className="mb-2 text-gray-500 group-hover:text-blue-400 transition-colors" />
                                                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">
                                                        {selectedFile ? selectedFile.name : "Click to Select File"}
                                                    </span>
                                                </div>
                                            </label>

                                            <button 
                                                onClick={handleSendFile}
                                                disabled={!selectedFile}
                                                className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1 ${
                                                    selectedFile 
                                                    ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-blue-900/20" 
                                                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                                                }`}
                                            >
                                                Send File
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar: Activity / Chat / Info */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Connected Peers Card */}
                        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Users size={20} className="text-purple-400" />
                                Connected Peers
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold">You</div>
                                        <span className="text-sm">Me</span>
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">Online</span>
                                </div>
                                {peers.map((peerId, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-800 animate-fade-in-up">
                                         <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">P{index+1}</div>
                                            <span className="text-sm font-mono">{peerId.substring(0, 8)}...</span>
                                        </div>
                                        <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20">Connected</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                         {/* Steps Card */}
                         <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-blue-400" />
                                Instructions
                            </h3>
                            <ol className="space-y-4 text-sm text-gray-400 list-decimal pl-4">
                                <li>Wait for a peer to join this room.</li>
                                <li>Once connected, the file transfer interface will appear.</li>
                                <li>Drag and drop files or click to select which files to send.</li>
                                <li>Accept incoming file requests on the other device.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoomPage;
