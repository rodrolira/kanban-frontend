/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../../types';
import { GripVertical, Edit2, Trash2, User, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; started: boolean }>({
    x: 0,
    y: 0,
    started: false,
  });

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: false,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const timeAgo = formatDistanceToNow(new Date(task.createdAt), {
    addSuffix: true,
    locale: es,
  });

  // Manejador personalizado para distinguir click de drag
  const handleMouseDown = (e: React.MouseEvent) => {
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      started: false,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStartRef.current.started && dragStartRef.current.x !== 0) {
      const dx = Math.abs(e.clientX - dragStartRef.current.x);
      const dy = Math.abs(e.clientY - dragStartRef.current.y);
      
      // Si se movió más de 5px, consideramos que es un drag
      if (dx > 5 || dy > 5) {
        dragStartRef.current.started = true;
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // Reset después de soltar
    setTimeout(() => {
      dragStartRef.current = { x: 0, y: 0, started: false };
    }, 100);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      // 👇 Listeners personalizados para controlar cuándo se activa el drag
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-3! mb-2! transition-all duration-200 select-none ${
        isDragging ? 'shadow-lg rotate-1' : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-2">
        {/* Ícono de drag visual (opcional, ya no es funcional para drag) */}
        <div className="mt-0.5! p-1! m-1! rounded opacity-50 group-hover:opacity-100">
          <GripVertical className="w-4 h-4 text-gray-400" />
        </div>

        {/* Contenido de la tarea */}
        <div 
          className="flex-1 min-w-0"
          {...listeners} // 👈 Los listeners van aquí para que toda el área de contenido sea arrastrable
        >
          <h4 className="text-sm font-medium text-gray-900 mb-1 wrap-break-word">
            {task.title}
          </h4>

          {task.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-500">
            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span>{task.assignee.name}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Acciones (aparecen al hover) - Fuera del área de drag */}
        {isHovered && (
          <div 
            className="flex gap-1 animate-fadeIn"
            onMouseDown={(e) => e.stopPropagation()} // Evita que el click en botón inicie drag
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => onEdit(task)}
              className="p-1! cursor-pointer rounded hover:bg-gray-100 transition-colors"
              title="Editar tarea"
            >
              <Edit2 className="w-3.5 h-3.5 text-gray-500 hover:text-indigo-600" />
            </button>
            <button
              onClick={() => onDelete(task.id)}
              className="p-1! cursor-pointer rounded hover:bg-gray-100 transition-colors"
              title="Eliminar tarea"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-500 hover:text-red-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};