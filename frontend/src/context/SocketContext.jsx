import { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { SOCKET_URL } from '../api/config';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [lastEvent, setLastEvent] = useState(null);

    useEffect(() => {
        const newSocket = io(SOCKET_URL);
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('[Socket] Connected');
            newSocket.emit('join', 'general'); // Join a default room or handle auth based rooms
        });

        // Universal event listener for debugging/logging
        const handleEvent = (type) => (data) => {
            console.log(`[SocketEvent] ${type}:`, data);
            setLastEvent({ type, data, timestamp: Date.now() });
        };

        newSocket.on('tx_event', handleEvent('tx_event'));
        newSocket.on('report_event', handleEvent('report_event'));
        newSocket.on('score_event', handleEvent('score_event'));
        newSocket.on('verification_event', handleEvent('verification_event'));

        return () => newSocket.close();
    }, []);

    return (
        <SocketContext.Provider value={{ socket, lastEvent }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
