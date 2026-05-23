/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { getSocket } from '../services/socket';
import { Wifi, WifiOff } from 'lucide-react';

export const RealTimeIndicator: React.FC = () => {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const socket = getSocket();
        if (!socket) return;

        const handleConnect = () => setIsConnected(true);
        const handleDisconnect = () => setIsConnected(false);

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        setIsConnected(socket.connected);

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, []);

    return (
        <div className="flex items-center gap-2 text-sm">
            {isConnected ? (
                <>
                    <Wifi className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Tiempo real activo</span>
                </>
            ) : (
                <>
                    <WifiOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-600">Reconectando...</span>
                </>
            )}
        </div>
    );
};