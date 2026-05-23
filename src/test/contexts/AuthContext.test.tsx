import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/api';

// Mock del servicio de auth
vi.mock('../services/api', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    getMe: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock de localStorage más robusto
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock de socket
vi.mock('../services/socket', () => ({
  initSocket: vi.fn(),
  disconnectSocket: vi.fn(),
  getSocket: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  })),
  joinBoardRoom: vi.fn(),
  leaveBoardRoom: vi.fn(),
  onSocketEvent: vi.fn(),
  offSocketEvent: vi.fn(),
}));

// Componente de prueba mejorado
const TestComponent = () => {
  const { user, login, register, logout, isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  return (
    <div>
      <div data-testid="auth-status">
        {isAuthenticated ? 'Authenticated' : 'Not authenticated'}
      </div>
      {user && <div data-testid="user-name">{user.name}</div>}
      <button onClick={() => login('test@test.com', 'password')}>
        Login
      </button>
      <button onClick={() => register('test@test.com', 'password', 'Test User')}>
        Register
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  // ... tests anteriores ...

  describe('logout', () => {
    it('debería cerrar sesión correctamente', async () => {
      // Configurar estado inicial autenticado
      const mockUser = { 
        id: '1', 
        name: 'Test User', 
        email: 'test@test.com', 
        role: 'MEMBER' as const 
      };
      const mockToken = 'fake-token';
      
      // Guardar en localStorage antes del render
      localStorageMock.setItem('token', mockToken);
      localStorageMock.setItem('user', JSON.stringify(mockUser));
      
      // Mock de getMe para que devuelva el usuario
      (authService.getMe as jest.Mock).mockResolvedValue({
        success: true,
        data: { user: mockUser },
      });
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );
      
      // Esperar a que se complete la autenticación inicial
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      });
      
      // Hacer click en logout
      const logoutButton = screen.getByText('Logout');
      await userEvent.click(logoutButton);
      
      // Verificar que el estado cambió
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('Not authenticated');
      });
      
      // Verificar que se llamó a removeItem en localStorage
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
      
      // Verificar que se llamó al servicio de logout
      expect(authService.logout).toHaveBeenCalled();
    });
  });
});