/* eslint-disable @typescript-eslint/no-unused-vars */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanProvider, useKanban } from '../../contexts/KanbanContext';
import { boardService, columnService, taskService } from '../../services/api';

// Mock de servicios
vi.mock('../services/api', () => ({
  boardService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  columnService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  taskService: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    moveBetweenColumns: vi.fn(),
    reorder: vi.fn(),
  },
}));

// Mock de socket
vi.mock('../services/socket', () => ({
  joinBoardRoom: vi.fn(),
  leaveBoardRoom: vi.fn(),
  onSocketEvent: vi.fn(),
  offSocketEvent: vi.fn(),
}));

// Componente de prueba
const TestComponent = () => {
  const { boards, currentBoard, isLoading, createBoard, loadBoards } = useKanban();
  
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="boards-count">{boards.length}</div>
      {currentBoard && <div data-testid="current-board">{currentBoard.name}</div>}
      <button onClick={() => createBoard('New Board')}>Create Board</button>
      <button onClick={loadBoards}>Load Boards</button>
    </div>
  );
};

describe('KanbanContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería cargar tableros correctamente', async () => {
    const mockBoards = [
      { id: '1', name: 'Board 1', ownerId: 'user1', columns: [] },
      { id: '2', name: 'Board 2', ownerId: 'user1', columns: [] },
    ];
    
    (boardService.getAll as jest.Mock).mockResolvedValue({
      success: true,
      data: { boards: mockBoards },
    });
    
    render(
      <KanbanProvider>
        <TestComponent />
      </KanbanProvider>
    );
    
    // Click para cargar tableros
    const loadButton = screen.getByText('Load Boards');
    await userEvent.click(loadButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('boards-count')).toHaveTextContent('2');
    });
  });

  it('debería crear un tablero correctamente', async () => {
    const newBoard = { id: '3', name: 'New Board', ownerId: 'user1', columns: [] };
    
    (boardService.create as jest.Mock).mockResolvedValue({
      success: true,
      data: { board: newBoard },
    });
    
    (boardService.getAll as jest.Mock).mockResolvedValue({
      success: true,
      data: { boards: [] },
    });
    
    render(
      <KanbanProvider>
        <TestComponent />
      </KanbanProvider>
    );
    
    const createButton = screen.getByText('Create Board');
    await userEvent.click(createButton);
    
    await waitFor(() => {
      expect(boardService.create).toHaveBeenCalledWith('New Board');
    });
  });

  it('debería manejar error al cargar tableros', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    (boardService.getAll as jest.Mock).mockRejectedValue(new Error('Network error'));
    
    render(
      <KanbanProvider>
        <TestComponent />
      </KanbanProvider>
    );
    
    const loadButton = screen.getByText('Load Boards');
    await userEvent.click(loadButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('boards-count')).toHaveTextContent('0');
    });
    
    consoleError.mockRestore();
  });
});