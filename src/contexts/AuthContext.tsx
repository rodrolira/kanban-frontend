/* eslint-disable react-refresh/only-export-components */

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthState } from '../types';
import { authService } from '../services/api';
import toast from 'react-hot-toast';
import { initSocket, disconnectSocket } from '../services/socket';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Verificar si hay token guardado al cargar la app
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const user = JSON.parse(savedUser) as User;
          initSocket(token);


          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Verificar token con el backend
          const response = await authService.getMe();
          if (response.success) {
            setState({
              user: response.data.user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });
            console.log('✅ Usuario autenticado y socket conectado');
          } else {
            // Token inválido
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            disconnectSocket();
            setState({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        } catch (error) {
          // Error al verificar token
          console.error('Error verificando autenticación:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          disconnectSocket();
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);

      if (response.success) {
        const { user, token } = response.data;

        // Guardar en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // INICIALIZAR SOCKET INMEDIATAMENTE después del login
        initSocket(token);

        // Actualizar estado
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });

        toast.success(`✨ ¡Bienvenido, ${user.name}!`);
        console.log('🔌 Socket inicializado después de login');
      } else {
        toast.error(response.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('Login error:', err);
      // El interceptor ya muestra el toast de error
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await authService.register(email, password, name);

      if (response.success) {
        const { user, token } = response.data;
        // Guardar en localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        // 🔥 INICIALIZAR SOCKET INMEDIATAMENTE después del registro
        initSocket(token);

        // Actualizar estado
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });

        toast.success('Registro exitoso! Bienvenido!');
        console.log('🔌 Socket inicializado después de registro');
      } else {
        toast.error(response.error || 'Error al registrarse');
      }
    } catch (err) {
      console.error('Register error:', err);
    }
  };

  const logout = () => {
    disconnectSocket()

    authService.logout();

    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    toast.success('Sesión cerrada correctamente');
    console.log('🔌 Socket desconectado');
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};