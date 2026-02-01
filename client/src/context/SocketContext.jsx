import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../config/api';

const SocketContext = createContext();

export const useSocketContext = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Only initialize once
        if (!socketRef.current) {
            socketRef.current = io(SERVER_URL);
            setSocket(socketRef.current);

            socketRef.current.on('connect', () => {
                console.log('Connected to signaling server:', socketRef.current.id);
                setIsConnected(true);
            });

            socketRef.current.on('disconnect', () => {
                console.log('Disconnected from signaling server');
                setIsConnected(false);
            });
            
            socketRef.current.on('connect_error', (err) => {
                console.error('Socket connection error:', err);
                setIsConnected(false);
            });
        }

        return () => {
             // Optional: Don't disconnect on unmount if you want persistence across pages, 
             // but for now, let's keep it clean or handle it in specific cleanup if needed.
             // Usually for a SPA, we might want to keep the socket alive.
             // If we strict mode double invokes, we need to be careful.
             // For now, let's effectively not 'disconnect' hard here so it persists across routes
             // unless we want to strictly manage lifecycle.
        };
    }, []);

    return (
        <SocketContext.Provider value={{ socket, isConnected }}>
            {children}
        </SocketContext.Provider>
    );
};
