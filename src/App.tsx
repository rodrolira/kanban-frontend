// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { KanbanProvider } from './contexts/KanbanContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { BoardListPage } from './pages/BoardListPage';
import { BoardPage } from './pages/BoardPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <KanbanProvider>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* Rutas protegidas - ProtectedRoute usa Outlet */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/boards" element={<BoardListPage />} />
                <Route path="/boards/:boardId" element={<BoardPage />} />
                <Route path="/" element={<Navigate to="/boards" replace />} />
              </Route>
            </Route>
            
            {/* Ruta 404 */}
            <Route path="*" element={<Navigate to="/boards" replace />} />
          </Routes>
        </KanbanProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;