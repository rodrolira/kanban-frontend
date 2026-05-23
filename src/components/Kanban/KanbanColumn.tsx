import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Column, Task } from '../../types';
import { TaskCard } from './TaskCard';
import { Plus, MoreHorizontal, Edit2, Trash2, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface KanbanColumnProps {
    column: Column;
    onAddTask: (columnId: string, title: string) => void;
    onEditTask: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onEditColumn: (columnId: string, title: string) => void;
    onDeleteColumn: (columnId: string) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
    column,
    onAddTask,
    onEditTask,
    onDeleteTask,
    onEditColumn,
    onDeleteColumn,
}) => {
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isEditingColumn, setIsEditingColumn] = useState(false);
    const [columnTitle, setColumnTitle] = useState(column.title);

    const { setNodeRef } = useDroppable({
        id: column.id,
        data: {
            type: 'column',
            column,
        },
    });

    const handleAddTask = () => {
        if (newTaskTitle.trim()) {
            onAddTask(column.id, newTaskTitle.trim());
            setNewTaskTitle('');
            setIsAddingTask(false);
        }
    };

    const handleEditColumn = () => {
        if (columnTitle.trim() && columnTitle !== column.title) {
            onEditColumn(column.id, columnTitle.trim());
        }
        setIsEditingColumn(false);
    };

    const taskIds = column.tasks.map(task => task.id);

    return (
        <div className="bg-gray-50 rounded-lg w-80 shrink-0 flex flex-col max-h-full">
            {/* Header de la columna */}
            <div className="p-3! border-b border-gray-200">
                {isEditingColumn ? (
                    <div className="flex gap-2">
                        <Input
                            value={columnTitle}
                            onChange={(e) => setColumnTitle(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleEditColumn()}
                            autoFocus
                            className="flex-1"
                        />
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleEditColumn}
                            className="px-3!"
                        >
                            ✓
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setColumnTitle(column.title);
                                setIsEditingColumn(false);
                            }}
                            className="px-2!"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{column.title}</h3>
                            <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
                                {column.tasks.length}
                            </span>
                        </div>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setIsAddingTask(true)}
                                className="p-1! rounded cursor-pointer! hover:bg-gray-200 transition-colors"
                                title="Añadir tarea"
                            >
                                <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                            <div className="relative group">
                                <button className="p-1! cursor-pointer! rounded hover:bg-gray-200 transition-colors">
                                    <MoreHorizontal className="w-4 h-4 text-gray-600" />
                                </button>
                                <div className="absolute right-0 mt-1! bg-white rounded-lg shadow-lg border border-gray-200 hidden group-hover:block z-10">
                                    <button
                                        onClick={() => setIsEditingColumn(true)}
                                        className="flex items-center gap-2 px-3! py-1.5! text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => onDeleteColumn(column.id)}
                                        className="flex items-center gap-2 px-3! py-1.5! text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Área de tareas (droppable) */}
            <div
                ref={setNodeRef}
                className="flex-1 overflow-y-auto p-2! min-h-[200px]"
                style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
                <SortableContext
                    items={taskIds}
                    strategy={verticalListSortingStrategy}
                >
                    {column.tasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onEdit={onEditTask}
                            onDelete={onDeleteTask}
                        />
                    ))}
                </SortableContext>

                {column.tasks.length === 0 && (
                    <div className="text-center py-8! text-gray-400 text-sm">
                        No hay tareas
                    </div>
                )}
            </div>

            {/* Formulario para añadir tarea */}
            {isAddingTask && (
                <div className="p-3! border-t border-gray-200 bg-white rounded-b-lg">
                    <Input
                        placeholder="Título de la tarea..."
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddTask()}
                        autoFocus
                        className="mb-2!"
                    />
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleAddTask}>
                            Añadir
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setIsAddingTask(false);
                                setNewTaskTitle('');
                            }}
                        >
                            Cancelar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};