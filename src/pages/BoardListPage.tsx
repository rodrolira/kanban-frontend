/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/BoardListPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKanban } from '../contexts/KanbanContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Plus, LayoutGrid, Trash2, Edit2, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export const BoardListPage: React.FC = () => {
  const navigate = useNavigate();
  const { boards, isLoading, createBoard, deleteBoard, updateBoard } = useKanban();
  const [isCreating, setIsCreating] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [editingBoard, setEditingBoard] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // No llamar a loadBoards aquí - ya se carga en el provider

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) {
      toast.error('Por favor, ingresa un nombre para el tablero');
      return;
    }
    await createBoard(newBoardName.trim());
    setNewBoardName('');
    setIsCreating(false);
  };

  const handleDeleteBoard = async (boardId: string, boardName: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el tablero "${boardName}"?`)) {
      await deleteBoard(boardId);
    }
  };

  const handleUpdateBoard = async (boardId: string) => {
    if (!editName.trim()) return;
    await updateBoard(boardId, editName.trim());
    setEditingBoard(null);
    setEditName('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
        <span className="ml-2! text-gray-600">Cargando tableros...</span>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center my-3!">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mis Tableros</h2>
          <p className="text-gray-600 mt-1">Gestiona tus proyectos y tareas</p>
        </div>
        <Button className='flex' variant="primary" onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2!" />
          Nuevo Tablero
        </Button>
      </div>

      {/* Formulario para crear tablero */}
      {isCreating && (
        <div className="bg-white mx-auto! rounded-lg shadow-md p-4! mb-6! w-[50%]">
          <h3 className="font-semibold text-gray-800 mb-3!">Crear nuevo tablero</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Nombre del tablero"
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateBoard()}
              autoFocus
              className="flex-1"
            />
            <Button onClick={handleCreateBoard}>Crear</Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreating(false);
                setNewBoardName('');
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Mostrar mensaje si no hay boards */}
      {boards.length === 0 && (
        <div className="text-center py-12! bg-white rounded-lg shadow-sm">
          <LayoutGrid className="w-16 h-16 text-gray-300 mx-auto! mb-4!" />
          <h3 className="text-lg font-medium text-gray-900 mb-2!">
            No tienes tableros aún
          </h3>
          <p className="text-gray-500 mb-4!">
            Crea tu primer tablero para comenzar a organizar tus tareas
          </p>
          <Button className='flex items-center mx-auto!' onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2!" />
            Crear mi primer tablero
          </Button>
        </div>
      )}

      {/* Grid de tableros */}
      {boards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map((board) => (
            <div
              key={board.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer group"
            >
              {editingBoard === board.id ? (
                <div className="p-4!" onClick={(e) => e.stopPropagation()}>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleUpdateBoard(board.id)}
                    autoFocus
                    className="mb-2"
                  />
                  <div className="flex gap-2">
                    <Button className='mt-3!' size="sm" onClick={() => handleUpdateBoard(board.id)}>
                      Guardar
                    </Button>
                    <Button
                    className='mt-3!'
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingBoard(null);
                        setEditName('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    className="p-4! cursor-pointer"
                    onClick={() => navigate(`/boards/${board.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-2! line-clamp-1">
                          {board.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {board.columns?.length || 0} columnas
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 px-4! py-2! flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingBoard(board.id);
                        setEditName(board.name);
                      }}
                      className="p-1! hover:bg-gray-100 rounded transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteBoard(board.id, board.name)}
                      className="p-1! hover:bg-gray-100 rounded transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};