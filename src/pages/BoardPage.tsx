/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  closestCenter,
  DragOverlay,
  defaultDropAnimationSideEffects,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { useKanban } from '../contexts/KanbanContext';
import { KanbanColumn } from '../components/Kanban/KanbanColumn';
import { TaskModal } from '../components/Kanban/TaskModal';
import { TaskCard } from '../components/Kanban/TaskCard';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Plus, Loader } from 'lucide-react';
import { Task } from '../types';
import toast from 'react-hot-toast';

export const BoardPage: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();
  const {
    currentBoard,
    isLoading,
    loadBoard,
    createColumn,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    updateColumn,
    deleteColumn,
  } = useKanban();
  
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  
  // Configurar sensores para evitar drags accidentales
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5, // Mover 5px antes de activar
    },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200,
      tolerance: 5,
    },
  });
  
  const sensors = useSensors(mouseSensor, touchSensor);

  useEffect(() => {
    if (boardId) {
      loadBoard(boardId);
    }
  }, [boardId, loadBoard]);

  const handleAddColumn = () => {
    if (newColumnTitle.trim() && boardId) {
      createColumn(boardId, newColumnTitle.trim());
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  const handleAddTask = (columnId: string, title: string) => {
    createTask(columnId, title);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('¿Estás seguro de eliminar esta tarea?')) {
      deleteTask(taskId);
    }
  };

  const handleSaveTask = (taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, updates);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = currentBoard?.columns
      .flatMap(col => col.tasks)
      .find(t => t.id === active.id);
    
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Limpiar el activeTask inmediatamente
    setActiveTask(null);
    
    // Si no hay destino o el destino es el mismo elemento, no hacer nada
    if (!over || active.id === over.id) {
      return;
    }
    
    // Encontrar la tarea que se está moviendo
    let sourceColumnId: string | null = null;
    let sourceTaskIndex: number = -1;
    let destinationColumnId: string | null = null;
    let destinationIndex: number = -1;
    
    // Buscar en todas las columnas
    for (const column of currentBoard?.columns || []) {
      const taskIndex = column.tasks.findIndex(t => t.id === active.id);
      if (taskIndex !== -1) {
        sourceColumnId = column.id;
        sourceTaskIndex = taskIndex;
        break;
      }
    }
    
    if (!sourceColumnId) return;
    
    // Determinar el destino
    // Caso 1: Se soltó sobre una columna
    const overColumn = currentBoard?.columns.find(c => c.id === over.id);
    if (overColumn) {
      destinationColumnId = overColumn.id;
      destinationIndex = overColumn.tasks.length; // Al final de la columna
    } 
    // Caso 2: Se soltó sobre una tarea
    else {
      for (const column of currentBoard?.columns || []) {
        const taskIndex = column.tasks.findIndex(t => t.id === over.id);
        if (taskIndex !== -1) {
          destinationColumnId = column.id;
          destinationIndex = taskIndex;
          break;
        }
      }
    }
    
    if (!destinationColumnId) return;
    
    // Si es la misma columna y la posición no cambió, no hacer nada
    if (sourceColumnId === destinationColumnId && sourceTaskIndex === destinationIndex) {
      return;
    }
    
    // Si es la misma columna pero cambió de orden
    if (sourceColumnId === destinationColumnId) {
      // Ajustar el índice si se mueve hacia abajo
      const finalDestinationIndex = sourceTaskIndex < destinationIndex 
        ? destinationIndex 
        : destinationIndex;
      
      // Llamar a la función de reordenamiento
      await moveTask(
        active.id as string,
        sourceColumnId,
        destinationColumnId,
        finalDestinationIndex
      );
    } 
    // Si es diferente columna
    else {
      await moveTask(
        active.id as string,
        sourceColumnId,
        destinationColumnId,
        destinationIndex
      );
    }
  }, [currentBoard, moveTask]);

  const handleDragOver = (event: DragOverEvent) => {
    // Opcional: feedback visual durante el drag
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!currentBoard) {
    return (
      <div className="text-center py-12!">
        <p className="text-gray-600">Tablero no encontrado</p>
        <Button onClick={() => navigate('/boards')} className="mt-4!">
          Volver a mis tableros
        </Button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="flex items-center justify-between my-3!">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/boards')}
            className="p-2 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">{currentBoard.name}</h1>
        </div>
      </div>

      {/* Kanban Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '500px' }}>
          {currentBoard.columns
            .sort((a, b) => a.order - b.order)
            .map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onEditColumn={updateColumn}
                onDeleteColumn={deleteColumn}
              />
            ))}
          
          {/* Botón para añadir columna */}
          <div className="w-80 shrink-0">
            {isAddingColumn ? (
              <div className="bg-gray-50 rounded-lg p-3!">
                <Input
                  placeholder="Título de la columna..."
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddColumn()}
                  autoFocus
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddColumn}>
                    Añadir
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAddingColumn(false);
                      setNewColumnTitle('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="w-full bg-gray-50 hover:bg-gray-100 rounded-lg p-4 text-gray-600 transition-colors border-2 border-dashed border-gray-300"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Añadir columna
              </button>
            )}
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.4',
                },
              },
            }),
          }}
        >
          {activeTask && (
            <div className="transform rotate-3 scale-105">
              <TaskCard
                task={activeTask}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Modal de edición de tarea */}
      {editingTask && (
        <TaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
};