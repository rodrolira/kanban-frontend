/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/contexts/KanbanContext.tsx
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { Board, Column, Task, KanbanState } from '../types';
import { boardService, columnService, taskService } from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { onSocketEvent, offSocketEvent, joinBoardRoom, leaveBoardRoom, getSocket } from '../services/socket';

interface KanbanContextType extends KanbanState {
  loadBoards: () => Promise<void>;
  loadBoard: (boardId: string) => Promise<void>;
  createBoard: (name: string) => Promise<void>;
  updateBoard: (boardId: string, name: string) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  createColumn: (boardId: string, title: string) => Promise<void>;
  updateColumn: (columnId: string, title: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;
  createTask: (columnId: string, title: string, description?: string) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, sourceColumnId: string, destinationColumnId: string, newOrder: number) => Promise<void>;
  reorderTasks: (columnId: string, taskIds: string[]) => Promise<void>;
}

const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error('useKanban must be used within KanbanProvider');
  }
  return context;
};

export const KanbanProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [state, setState] = useState<KanbanState>({
    boards: [],
    currentBoard: null,
    isLoading: false,
    error: null,
  });
  
  // Usar refs para evitar problemas
  const hasLoaded = useRef(false);
  const socketListenersRegistered = useRef(false);
  const currentBoardIdRef = useRef<string | null>(null);
  // 🔥 IMPORTANTE: Ref para evitar procesar eventos de socket para movimientos propios
  const pendingMoveRef = useRef<{ taskId: string; timestamp: number } | null>(null);

  // Cargar todos los tableros del usuario
  const loadBoards = useCallback(async () => {
    if (!isAuthenticated) {
      console.log('loadBoards: not authenticated');
      return;
    }
    
    if (state.isLoading) {
      console.log('loadBoards: already loading, skipping');
      return;
    }
    
    console.log('loadBoards: loading boards...');
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await boardService.getAll();
      console.log('loadBoards response:', response);
      
      if (response.success && response.data && response.data.boards) {
        console.log('Boards loaded:', response.data.boards.length);
        setState(prev => ({ 
          ...prev, 
          boards: response.data.boards, 
          isLoading: false 
        }));
      } else {
        setState(prev => ({ ...prev, boards: [], isLoading: false }));
      }
    } catch (error) {
      console.error('loadBoards error:', error);
      setState(prev => ({ ...prev, isLoading: false, error: 'Error al cargar tableros', boards: [] }));
    }
  }, [isAuthenticated, state.isLoading]);

  // Cargar un tablero específico
  const loadBoard = useCallback(async (boardId: string) => {
    if (!boardId) return;
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await boardService.getById(boardId);
      if (response.success && response.data && response.data.board) {
        setState(prev => ({ ...prev, currentBoard: response.data.board, isLoading: false }));
        currentBoardIdRef.current = boardId;
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('loadBoard error:', error);
      setState(prev => ({ ...prev, isLoading: false, error: 'Error al cargar el tablero' }));
    }
  }, []);

  // Crear nuevo tablero
  const createBoard = useCallback(async (name: string) => {
    try {
      const response = await boardService.create(name);
      if (response.success && response.data && response.data.board) {
        setState(prev => ({
          ...prev,
          boards: [response.data.board, ...prev.boards]
        }));
        toast.success('Tablero creado exitosamente');
        return response.data.board;
      }
    } catch (error) {
      toast.error('Error al crear el tablero');
      throw error;
    }
  }, []);

  // Actualizar tablero
  const updateBoard = useCallback(async (boardId: string, name: string) => {
    try {
      const response = await boardService.update(boardId, name);
      if (response.success && response.data && response.data.board) {
        setState(prev => ({
          ...prev,
          boards: prev.boards.map(board => 
            board.id === boardId ? response.data.board : board
          ),
          currentBoard: prev.currentBoard?.id === boardId ? response.data.board : prev.currentBoard
        }));
        toast.success('Tablero actualizado');
      }
    } catch (error) {
      toast.error('Error al actualizar el tablero');
    }
  }, []);

  // Eliminar tablero
  const deleteBoard = useCallback(async (boardId: string) => {
    try {
      const response = await boardService.delete(boardId);
      if (response.success) {
        setState(prev => ({
          ...prev,
          boards: prev.boards.filter(board => board.id !== boardId),
          currentBoard: prev.currentBoard?.id === boardId ? null : prev.currentBoard
        }));
        toast.success('Tablero eliminado');
      }
    } catch (error) {
      toast.error('Error al eliminar el tablero');
    }
  }, []);

  // Crear columna
  const createColumn = useCallback(async (boardId: string, title: string) => {
    try {
      const response = await columnService.create(boardId, title);
      if (response.success && response.data && response.data.column && state.currentBoard) {
        const updatedBoard = {
          ...state.currentBoard,
          columns: [...state.currentBoard.columns, response.data.column]
        };
        setState(prev => ({ ...prev, currentBoard: updatedBoard }));
        toast.success('Columna creada');
      }
    } catch (error) {
      toast.error('Error al crear la columna');
    }
  }, [state.currentBoard]);

  // Actualizar columna
  const updateColumn = useCallback(async (columnId: string, title: string) => {
    try {
      const response = await columnService.update(columnId, title);
      if (response.success && state.currentBoard) {
        const updatedBoard = {
          ...state.currentBoard,
          columns: state.currentBoard.columns.map(col =>
            col.id === columnId ? { ...col, title } : col
          )
        };
        setState(prev => ({ ...prev, currentBoard: updatedBoard }));
        toast.success('Columna actualizada');
      }
    } catch (error) {
      toast.error('Error al actualizar la columna');
    }
  }, [state.currentBoard]);

  // Eliminar columna
  const deleteColumn = useCallback(async (columnId: string) => {
    try {
      const response = await columnService.delete(columnId);
      if (response.success && state.currentBoard) {
        const updatedBoard = {
          ...state.currentBoard,
          columns: state.currentBoard.columns.filter(col => col.id !== columnId)
        };
        setState(prev => ({ ...prev, currentBoard: updatedBoard }));
        toast.success('Columna eliminada');
      }
    } catch (error) {
      toast.error('Error al eliminar la columna');
    }
  }, [state.currentBoard]);

  // Crear tarea
  const createTask = useCallback(async (columnId: string, title: string, description?: string) => {
    try {
      const response = await taskService.create(columnId, title, description);
      if (response.success && response.data && response.data.task && state.currentBoard) {
        const updatedBoard = {
          ...state.currentBoard,
          columns: state.currentBoard.columns.map(col =>
            col.id === columnId
              ? { ...col, tasks: [...col.tasks, response.data.task] }
              : col
          )
        };
        setState(prev => ({ ...prev, currentBoard: updatedBoard }));
        toast.success('Tarea creada');
      }
    } catch (error) {
      toast.error('Error al crear la tarea');
    }
  }, [state.currentBoard]);

  // Actualizar tarea
  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await taskService.update(taskId, updates);
      if (response.success && response.data && response.data.task && state.currentBoard) {
        const updatedBoard = {
          ...state.currentBoard,
          columns: state.currentBoard.columns.map(col => ({
            ...col,
            tasks: col.tasks.map(task =>
              task.id === taskId ? { ...task, ...updates } : task
            )
          }))
        };
        setState(prev => ({ ...prev, currentBoard: updatedBoard }));
        toast.success('Tarea actualizada');
      }
    } catch (error) {
      toast.error('Error al actualizar la tarea');
    }
  }, [state.currentBoard]);

  // Eliminar tarea
  const deleteTask = useCallback(async (taskId: string) => {
    try {
      const response = await taskService.delete(taskId);
      if (response.success && state.currentBoard) {
        const updatedBoard = {
          ...state.currentBoard,
          columns: state.currentBoard.columns.map(col => ({
            ...col,
            tasks: col.tasks.filter(task => task.id !== taskId)
          }))
        };
        setState(prev => ({ ...prev, currentBoard: updatedBoard }));
        toast.success('Tarea eliminada');
      }
    } catch (error) {
      toast.error('Error al eliminar la tarea');
    }
  }, [state.currentBoard]);

  // 🔥 Mover tarea entre columnas - VERSIÓN CORREGIDA (sin duplicación)
  const moveTask = useCallback(async (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    newOrder: number
  ) => {
    // Registrar el movimiento pendiente para ignorar el evento de socket propio
    pendingMoveRef.current = {
      taskId,
      timestamp: Date.now()
    };
    
    // Limpiar después de 2 segundos (tiempo suficiente para que llegue el socket)
    setTimeout(() => {
      if (pendingMoveRef.current?.taskId === taskId) {
        pendingMoveRef.current = null;
      }
    }, 2000);

    // Optimistic update: actualizar UI inmediatamente
    if (state.currentBoard) {
      const sourceColumn = state.currentBoard.columns.find(col => col.id === sourceColumnId);
      const destColumn = state.currentBoard.columns.find(col => col.id === destinationColumnId);
      
      if (sourceColumn && destColumn) {
        const taskToMove = sourceColumn.tasks.find(task => task.id === taskId);
        if (taskToMove) {
          // Crear copias actualizadas
          const newSourceTasks = sourceColumn.tasks.filter(task => task.id !== taskId);
          const newDestTasks = [...destColumn.tasks];
          newDestTasks.splice(newOrder, 0, { ...taskToMove, columnId: destinationColumnId });
          
          const updatedColumns = state.currentBoard.columns.map(col => {
            if (col.id === sourceColumnId) {
              return { ...col, tasks: newSourceTasks.map((task, idx) => ({ ...task, order: idx })) };
            }
            if (col.id === destinationColumnId) {
              return { ...col, tasks: newDestTasks.map((task, idx) => ({ ...task, order: idx })) };
            }
            return col;
          });
          
          setState(prev => ({
            ...prev,
            currentBoard: { ...prev.currentBoard!, columns: updatedColumns }
          }));
        }
      }
    }
    
    // Persistir en backend
    try {
      await taskService.moveBetweenColumns(taskId, sourceColumnId, destinationColumnId, newOrder);
      // No mostrar toast aquí porque el socket ya lo mostrará
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Error al mover la tarea');
      // Recargar para corregir el estado
      if (state.currentBoard) {
        await loadBoard(state.currentBoard.id);
      }
      pendingMoveRef.current = null;
    }
  }, [state.currentBoard, loadBoard]);

  // Reordenar tareas
  const reorderTasks = useCallback(async (columnId: string, taskIds: string[]) => {
    try {
      await taskService.reorder(columnId, taskIds);
      toast.success('Tareas reordenadas');
    } catch (error) {
      toast.error('Error al reordenar tareas');
    }
  }, []);

  // ============================================
  // SOCKET.IO EVENT HANDLERS
  // ============================================
  
  // Registrar listeners de socket globales (solo una vez)
  useEffect(() => {
    if (!isAuthenticated || socketListenersRegistered.current) return;
    
    console.log('🎧 Registering socket event listeners');
    socketListenersRegistered.current = true;
    
    // Escuchar creación de tareas
    onSocketEvent('task:created', (data: { task: Task; boardId: string; columnId: string }) => {
      console.log('📡 Socket event: task:created', data);
      
      setState(prev => {
        if (!prev.currentBoard || prev.currentBoard.id !== data.boardId) return prev;
        
        const updatedColumns = prev.currentBoard.columns.map(col =>
          col.id === data.columnId
            ? { ...col, tasks: [...col.tasks, data.task] }
            : col
        );
        
        return {
          ...prev,
          currentBoard: { ...prev.currentBoard, columns: updatedColumns }
        };
      });
      
      toast.success(`Nueva tarea: ${data.task.title}`, { icon: '📝' });
    });
    
    // Escuchar actualización de tareas
    onSocketEvent('task:updated', (data: { task: Task; boardId: string }) => {
      console.log('📡 Socket event: task:updated', data);
      
      setState(prev => {
        if (!prev.currentBoard || prev.currentBoard.id !== data.boardId) return prev;
        
        const updatedColumns = prev.currentBoard.columns.map(col => ({
          ...col,
          tasks: col.tasks.map(task =>
            task.id === data.task.id ? data.task : task
          )
        }));
        
        return {
          ...prev,
          currentBoard: { ...prev.currentBoard, columns: updatedColumns }
        };
      });
    });
    
    // Escuchar eliminación de tareas
    onSocketEvent('task:deleted', (data: { taskId: string; columnId: string; boardId: string }) => {
      console.log('📡 Socket event: task:deleted', data);
      
      setState(prev => {
        if (!prev.currentBoard || prev.currentBoard.id !== data.boardId) return prev;
        
        const updatedColumns = prev.currentBoard.columns.map(col =>
          col.id === data.columnId
            ? { ...col, tasks: col.tasks.filter(task => task.id !== data.taskId) }
            : col
        );
        
        return {
          ...prev,
          currentBoard: { ...prev.currentBoard, columns: updatedColumns }
        };
      });
      
      toast.success('Tarea eliminada', { icon: '🗑️' });
    });
    
    // 🔥 Escuchar movimiento de tareas - VERSIÓN CORREGIDA (ignora movimientos propios)
    onSocketEvent('task:moved', (data: {
      taskId: string;
      sourceColumnId: string;
      destinationColumnId: string;
      newOrder: number;
      task: Task;
      boardId: string;
      userId?: string;
    }) => {
      console.log('📡 Socket event: task:moved', data);
      
      // 🔥 IMPORTANTE: Ignorar si fue un movimiento propio (optimistic update ya lo hizo)
      if (pendingMoveRef.current?.taskId === data.taskId) {
        console.log('⏭️ Ignorando evento de socket propio para tarea:', data.taskId);
        pendingMoveRef.current = null;
        return;
      }
      
      setState(prev => {
        if (!prev.currentBoard || prev.currentBoard.id !== data.boardId) return prev;
        
        // Verificar si la tarea ya existe en el destino (para evitar duplicados)
        const destColumn = prev.currentBoard.columns.find(col => col.id === data.destinationColumnId);
        const taskExists = destColumn?.tasks.some(t => t.id === data.taskId);
        
        if (taskExists) {
          console.log('⚠️ Tarea ya existe en destino, ignorando evento');
          return prev;
        }
        
        // Remover tarea de columna origen
        let updatedColumns = prev.currentBoard.columns.map(col => {
          if (col.id === data.sourceColumnId) {
            return { ...col, tasks: col.tasks.filter(t => t.id !== data.taskId) };
          }
          return col;
        });
        
        // Añadir tarea a columna destino
        updatedColumns = updatedColumns.map(col => {
          if (col.id === data.destinationColumnId) {
            const newTasks = [...col.tasks];
            newTasks.splice(data.newOrder, 0, data.task);
            return { ...col, tasks: newTasks.map((t, idx) => ({ ...t, order: idx })) };
          }
          return col;
        });
        
        return {
          ...prev,
          currentBoard: { ...prev.currentBoard, columns: updatedColumns }
        };
      });
      
      toast.success(`Tarea movida${data.userId ? ' por otro usuario' : ''}`, { icon: '🔄' });
    });
    
    // Escuchar creación de columnas
    onSocketEvent('column:created', (data: { column: Column; boardId: string }) => {
      console.log('📡 Socket event: column:created', data);
      
      setState(prev => {
        if (!prev.currentBoard || prev.currentBoard.id !== data.boardId) return prev;
        
        return {
          ...prev,
          currentBoard: {
            ...prev.currentBoard,
            columns: [...prev.currentBoard.columns, data.column]
          }
        };
      });
    });
    
    // Escuchar actualización de columnas
    onSocketEvent('column:updated', (data: { column: Column; boardId: string }) => {
      console.log('📡 Socket event: column:updated', data);
      
      setState(prev => {
        if (!prev.currentBoard || prev.currentBoard.id !== data.boardId) return prev;
        
        const updatedColumns = prev.currentBoard.columns.map(col =>
          col.id === data.column.id ? data.column : col
        );
        
        return {
          ...prev,
          currentBoard: { ...prev.currentBoard, columns: updatedColumns }
        };
      });
    });
    
    // Escuchar eliminación de columnas
    onSocketEvent('column:deleted', (data: { columnId: string; boardId: string }) => {
      console.log('📡 Socket event: column:deleted', data);
      
      setState(prev => {
        if (!prev.currentBoard || prev.currentBoard.id !== data.boardId) return prev;
        
        return {
          ...prev,
          currentBoard: {
            ...prev.currentBoard,
            columns: prev.currentBoard.columns.filter(col => col.id !== data.columnId)
          }
        };
      });
    });
    
    // Limpiar listeners al desmontar
    return () => {
      console.log('🧹 Cleaning up socket event listeners');
      offSocketEvent('task:created');
      offSocketEvent('task:updated');
      offSocketEvent('task:deleted');
      offSocketEvent('task:moved');
      offSocketEvent('column:created');
      offSocketEvent('column:updated');
      offSocketEvent('column:deleted');
      socketListenersRegistered.current = false;
    };
  }, [isAuthenticated]);
  
  // Unirse a la sala del tablero actual y manejar eventos específicos del tablero
  useEffect(() => {
    const currentBoardId = state.currentBoard?.id;
    
    if (!currentBoardId || !isAuthenticated) return;
    
    console.log(`📡 Joining board room: ${currentBoardId}`);
    joinBoardRoom(currentBoardId);
    
    // Actualizar ref
    currentBoardIdRef.current = currentBoardId;
    
    return () => {
      if (currentBoardIdRef.current) {
        console.log(`📡 Leaving board room: ${currentBoardIdRef.current}`);
        leaveBoardRoom(currentBoardIdRef.current);
        currentBoardIdRef.current = null;
      }
    };
  }, [state.currentBoard?.id, isAuthenticated]);

  // Cargar tableros solo una vez al autenticarse
  useEffect(() => {
    if (isAuthenticated && !hasLoaded.current && !state.isLoading) {
      console.log('KanbanProvider: First load of boards');
      hasLoaded.current = true;
      loadBoards();
    }
  }, [isAuthenticated, loadBoards, state.isLoading]);

  // Verificar conexión de socket (debug)
  useEffect(() => {
    if (isAuthenticated) {
      const checkSocketConnection = setInterval(() => {
        const socket = getSocket();
        if (socket && socket.connected) {
          console.log('✅ Socket connected:', socket.id);
        }
      }, 5000);
      
      return () => clearInterval(checkSocketConnection);
    }
  }, [isAuthenticated]);

  return (
    <KanbanContext.Provider
      value={{
        ...state,
        loadBoards,
        loadBoard,
        createBoard,
        updateBoard,
        deleteBoard,
        createColumn,
        updateColumn,
        deleteColumn,
        createTask,
        updateTask,
        deleteTask,
        moveTask,
        reorderTasks,
      }}
    >
      {children}
    </KanbanContext.Provider>
  );
};