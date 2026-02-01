import { useRef, useState, useEffect, useCallback } from 'react';
import { useSocketContext } from '../context/SocketContext';
import toast from 'react-hot-toast';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
  ],
};

export const useWebRTC = (roomId) => {
  const { socket } = useSocketContext();
  const [connectionState, setConnectionState] = useState('disconnected'); // disconnected, connecting, connected, failed
  const peerConnection = useRef(null);
  const dataChannel = useRef(null);

  const [transferProgress, setTransferProgress] = useState(0);
  const [isTransferring, setIsTransferring] = useState(false);
  const [incomingFile, setIncomingFile] = useState(null); // { name, size, type }
  
  // Refs for file transfer
  const pendingFileRef = useRef(null); // The file object being sent
  const offsetRef = useRef(0);         // Current offset for sending
  const receivedChunksRef = useRef([]); // Array of received blobs/buffers
  const receivedSizeRef = useRef(0);    // Total bytes received so far

  const CHUNK_SIZE = 16 * 1024; // 16KB

  // Helper to create PeerConnection if it doesn't exist
  const createPeerConnection = useCallback(() => {
    if (peerConnection.current) return;

    console.log('Creating RTCPeerConnection');
    peerConnection.current = new RTCPeerConnection(ICE_SERVERS);

    // Handle ICE Candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', { roomId, candidate: event.candidate });
      }
    };

    // Handle Connection State Changes
    peerConnection.current.onconnectionstatechange = () => {
      console.log('Connection State:', peerConnection.current.connectionState);
      setConnectionState(peerConnection.current.connectionState);
    };

    peerConnection.current.oniceconnectionstatechange = () => {
      console.log('ICE Connection State:', peerConnection.current.iceConnectionState);
    };
  }, [socket, roomId]);

  // File Sending Logic
  const sendFile = useCallback((file) => {
    if (!dataChannel.current || dataChannel.current.readyState !== 'open') {
        toast.error("Connection not ready.");
        return;
    }

    console.log(`Starting file transfer: ${file.name} (${file.size} bytes)`);
    setIsTransferring(true);
    setTransferProgress(0);
    
    // 1. Send Metadata
    const metadata = {
        type: 'metadata',
        name: file.name,
        size: file.size,
        fileType: file.type
    };
    dataChannel.current.send(JSON.stringify(metadata));

    // 2. Prepare for chunking
    pendingFileRef.current = file;
    offsetRef.current = 0;
    
    // 3. Start sending chunks
    sendChunks();

  }, []);

  const sendChunks = () => {
    const channel = dataChannel.current;
    const file = pendingFileRef.current;
    
    if (!channel || !file) return;

    // Send chunks until buffer is full or file is done
    while (channel.bufferedAmount <= channel.bufferedAmountLowThreshold && offsetRef.current < file.size) {
        const end = Math.min(offsetRef.current + CHUNK_SIZE, file.size);
        const chunk = file.slice(offsetRef.current, end);
        channel.send(chunk);
        
        offsetRef.current += chunk.size;
        
        // Update Progress
        const percent = Math.min(100, Math.round((offsetRef.current / file.size) * 100));
        setTransferProgress(percent);
    }

    // If file not done, wait for buffer to drain
    if (offsetRef.current < file.size) {
        // We rely on 'bufferedamountlow' listener which we attach in setup
    } else {
        console.log("File sending complete.");
        setIsTransferring(false);
        toast.success("File sent successfully!");
        pendingFileRef.current = null;
    }
  };

  // 4.1 Sender Logic: Initiated when a peer joins
  const handleUserJoined = useCallback(async ({ userId }) => {
    console.log(`User joined: ${userId}. Initiating connection...`);
    createPeerConnection();

    // Create Data Channel (Sender side)
    dataChannel.current = peerConnection.current.createDataChannel('file-transfer');
    
    // Configure buffer threshold for backpressure
    dataChannel.current.bufferedAmountLowThreshold = 64 * 1024; // 64KB

    setupDataChannelListeners(dataChannel.current);

    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      console.log('Sending Offer');
      socket.emit('offer', { roomId, offer });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  }, [createPeerConnection, roomId, socket]);

  // 4.2 Receiver Logic: Handle incoming offer
  const handleOffer = useCallback(async ({ senderId, offer }) => {
    console.log(`Received Offer from ${senderId}`);
    createPeerConnection();

    // Handle Data Channel (Receiver side)
    peerConnection.current.ondatachannel = (event) => {
      console.log('Received Data Channel');
      dataChannel.current = event.channel;
      setupDataChannelListeners(dataChannel.current);
    };

    try {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      console.log('Sending Answer');
      socket.emit('answer', { roomId, answer });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  }, [createPeerConnection, roomId, socket]);

  // Handle incoming Answer
  const handleAnswer = useCallback(async ({ senderId, answer }) => {
    console.log(`Received Answer from ${senderId}`);
    try {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  }, []);

  // 4.3 Handle ICE Candidates
  const handleIceCandidate = useCallback(async ({ senderId, candidate }) => {
    try {
      if (peerConnection.current) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('Error adding ICE candidate:', err);
    }
  }, []);

  const setupDataChannelListeners = (channel) => {
    channel.binaryType = 'arraybuffer';
    
    channel.onopen = () => {
      console.log('Data Channel Open');
      toast.success('P2P Connection Established!');
      setConnectionState('connected');
    };

    // Handle Backpressure for Sender
    channel.onbufferedamountlow = () => {
        if (pendingFileRef.current) {
            sendChunks();
        }
    };

    channel.onmessage = (event) => {
       const data = event.data;
       
       // Handle Metadata (Initial Packet)
       if (typeof data === 'string') {
           try {
               const parsed = JSON.parse(data);
               if (parsed.type === 'metadata') {
                   console.log('Received Metadata:', parsed);
                   setIncomingFile(parsed);
                   receivedChunksRef.current = [];
                   receivedSizeRef.current = 0;
                   setIsTransferring(true);
                   setTransferProgress(0);
               }
           } catch (e) {
               console.error("Error parsing metadata", e);
           }
           return;
       }

       // Handle File Chunk (ArrayBuffer)
       if (data instanceof ArrayBuffer) {
           receivedChunksRef.current.push(data);
           receivedSizeRef.current += data.byteLength;

           // Calculate Progress
           if (incomingFileRef.current) {
               // Need to persist incomingFile in ref to access inside callback if closure issue
               // Or usually state is fine if component re-renders? 
               // Actually existing `incomingFile` state might be stale here if we don't depend on it.
               // We should use a ref for metadata too to be safe inside event listener.
           }
           
           // Using refs is safer for event listeners
           const totalSize = incomingFileRef.current ? incomingFileRef.current.size : 0;
           if (totalSize > 0) {
               const percent = Math.round((receivedSizeRef.current / totalSize) * 100);
               setTransferProgress(percent);

               // Check Completion
               if (receivedSizeRef.current === totalSize) {
                   console.log("File reception complete. Assembling...");
                   const blob = new Blob(receivedChunksRef.current, { type: incomingFileRef.current.fileType });
                   downloadFile(blob, incomingFileRef.current.name);
                   
                   // Reset
                   setIsTransferring(false);
                   toast.success(`Received ${incomingFileRef.current.name}!`);
                   setIncomingFile(null);
                   incomingFileRef.current = null;
                   receivedChunksRef.current = [];
                   receivedSizeRef.current = 0;
               }
           }
       }
    };

    channel.onclose = () => {
        console.log('Data Channel Closed');
        setConnectionState('disconnected');
        setIsTransferring(false);
    }
  };

  // Keep a ref to incoming file for the event listener
  const incomingFileRef = useRef(null);
  useEffect(() => {
    incomingFileRef.current = incomingFile;
  }, [incomingFile]);
  
  const downloadFile = (blob, fileName) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // Handle Peer Disconnect
  const handleUserLeft = useCallback(({ userId }) => {
    console.log(`User left: ${userId}`);
    toast('Peer disconnected', { icon: '🔌' });
    setConnectionState('disconnected');
    setIsTransferring(false);
    
    if (peerConnection.current) {
        peerConnection.current.close();
        peerConnection.current = null;
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('user-joined', handleUserJoined);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-left', handleUserLeft);
    
    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-left', handleUserLeft);
      
      if (peerConnection.current) {
          peerConnection.current.close();
          peerConnection.current = null;
      }
    };
  }, [socket, handleUserJoined, handleOffer, handleAnswer, handleIceCandidate, handleUserLeft]);

  return { connectionState, sendFile, transferProgress, isTransferring };
};
