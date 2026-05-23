/* eslint-disable @typescript-eslint/no-explicit-any */
import { io, Socket } from 'socket.io-client';
import { Board, Column, Task } from '../types';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Interfaz para eventos del socket
export interface SocketEvents {
  'task:created': (data: { task: Task; boardId: string; columnId: string }) => void;
  'task:updated': (data: { task: Task; boardId: string }) => void;
  'task:deleted': (data: { taskId: string; columnId: string; boardId: string }) => void;
  'task:moved': (data: {
    taskId: string;
    sourceColumnId: string;
    destinationColumnId: string;
    newOrder: number;
    task: Task;
    boardId: string;
  }) => void;
  'column:created': (data: { column: Column; boardId: string }) => void;
  'column:updated': (data: { column: Column; boardId: string }) => void;
  'column:deleted': (data: { columnId: string; boardId: string }) => void;
  'board:updated': (data: { board: Board; boardId: string }) => void;
  'board:deleted': (data: { boardId: string }) => void;
}

// Inicializar conexión socket
export const initSocket = (token: string): Socket => {
  if (socket && socket.connected) {
    console.log('Socket already connected, reusing');
    return socket;
  }
  
  if (socket) {
    console.log('Disconnecting old socket before reconnecting');
    socket.disconnect();
    socket = null;
  }
  
  console.log('Initializing socket connection...');
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });
  
  socket.on('connect', () => {
    console.log('🔌 Socket connected successfully:', socket?.id);
    reconnectAttempts = 0;
  });
  
  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    reconnectAttempts++;
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
    }
  });
  
  socket.on('reconnect', (attemptNumber) => {
    console.log(`Socket reconnected after ${attemptNumber} attempts`);
  });
  
  return socket;
};

// Obtener instancia del socket
export const getSocket = (): Socket | null => {
  return socket;
};

// Cerrar conexión socket
export const disconnectSocket = () => {
  if (socket) {
    console.log('Disconnecting socket');
    socket.disconnect();
    socket = null;
    reconnectAttempts = 0;
  }
};

// Unirse a un tablero
export const joinBoardRoom = (boardId: string) => {
  if (socket && socket.connected) {
    socket.emit('join-board', boardId);
    console.log(`📡 Joined board room: ${boardId}`);
  } else {
    console.warn('Cannot join board room: socket not connected');
  }
};

// Salir de un tablero
export const leaveBoardRoom = (boardId: string) => {
  if (socket && socket.connected) {
    socket.emit('leave-board', boardId);
    console.log(`📡 Left board room: ${boardId}`);
  }
};

// Escuchar eventos
export const onSocketEvent = <K extends keyof SocketEvents>(
  event: K,
  callback: SocketEvents[K]
) => {
  if (socket) {
    // Remover listeners anteriores para evitar duplicados
    socket.off(event);
    socket.on(event, callback as any);
    console.log(`🎧 Listening to event: ${event}`);
  } else {
    console.warn(`Cannot listen to ${event}: socket not initialized`);
  }
};

// Dejar de escuchar eventos
export const offSocketEvent = (event: keyof SocketEvents) => {
  if (socket) {
    socket.off(event);
    console.log(`🔇 Stopped listening to event: ${event}`);
  }
};

// Verificar si el socket está conectado
export const isSocketConnected = (): boolean => {
  return socket !== null && socket.connected;
};