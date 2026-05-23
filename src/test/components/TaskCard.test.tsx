import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../../components/Kanban/TaskCard';
import { Task } from '../../types';
import { vi } from 'vitest';

describe('TaskCard', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    order: 0,
    columnId: 'col1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería mostrar el título de la tarea', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('debería mostrar la descripción si existe', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('debería llamar a onEdit cuando se hace click en editar', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    // Hover para mostrar botones
    fireEvent.mouseEnter(screen.getByText('Test Task').closest('.bg-white')!);
    
    const editButton = screen.getByTitle('Editar tarea');
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it('debería llamar a onDelete cuando se hace click en eliminar', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    fireEvent.mouseEnter(screen.getByText('Test Task').closest('.bg-white')!);
    
    const deleteButton = screen.getByTitle('Eliminar tarea');
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockTask.id);
  });
});