/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect } from 'react';
import { Task, User } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Save, Trash2, User as UserIcon } from 'lucide-react';

interface TaskModalV2Props {
  task: Task | null;
  users?: User[];
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<Task>) => void;
  onDelete?: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalV2Props> = ({
  task,
  users = [],
  onClose,
  onSave,
  onDelete,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setAssigneeId(task.assigneeId || '');
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    
    onSave(task.id, {
      title,
      description: description || undefined,
      assigneeId: assigneeId || undefined,
    });
    onClose();
  };

  if (!task) return null;

  return (
    <>
      {/* Overlay más sutil - solo un poco de oscurecimiento */}
      <div 
        className="fixed inset-0 bg-black/10 backdrop-blur-[2px] transition-all duration-200 z-40"
        onClick={onClose}
      />
      
      {/* Modal flotante */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-50 animate-fade-in-scale">
        {/* Header con diseño mejorado */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 mx-1! bg-indigo-600 rounded-full"></div>
            <h3 className="font-semibold text-gray-900">Editar tarea</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1! rounded-md hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 m-2! h-4 text-gray-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4! space-y-4!">
          <Input
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título de la tarea"
            required
            autoFocus
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3! py-2! border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-sm"
              placeholder="Descripción detallada..."
            />
          </div>
          
          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <UserIcon className="w-3 h-3 inline mr-1" />
                Asignar a
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="">Sin asignar</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="flex  gap-2 pt-2!">
            <Button type="submit" variant="primary" className="flex-1 flex! items-center justify-center">
              <Save className="w-4 mr-1!" />
              Guardar
            </Button>
            
            {onDelete && (
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  if (confirm('¿Eliminar esta tarea?')) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            )}
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        .animate-fade-in-scale {
          animation: fadeInScale 0.2s ease-out;
        }
      `}</style>
    </>
  );
};