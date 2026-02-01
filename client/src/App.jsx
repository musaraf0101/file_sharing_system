import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { SocketProvider } from "./context/SocketContext";
import LandingPage from "./pages/LandingPage";
import RoomPage from "./pages/RoomPage";

function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;