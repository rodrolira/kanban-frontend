import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';
import { LogOut, LayoutGrid, Loader } from 'lucide-react';
import { RealTimeIndicator } from './RealTimeIndicator';

export const Layout: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-indigo-100 via-purple-50 to-pink-100">
        <Loader className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-100 via-purple-50 to-pink-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo y título */}
            <div 
              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => navigate('/boards')}
            >
              <LayoutGrid className="w-6 h-6 text-indigo-600" />
              <h1 className="text-xl font-bold text-gray-800">Kanban Flow</h1>
            </div>
            
            {/* Sección derecha con usuario y estado en tiempo real */}
            {user && (
              <div className="flex items-center gap-6">
                {/* Indicador de tiempo real */}
                <RealTimeIndicator />
                
                {/* Información del usuario */}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-700">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {user.role === 'ADMIN' ? 'Administrador' : 'Miembro'}
                  </p>
                </div>
                
                {/* Botón de logout */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logout}
                  className="hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Salir
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Contenido principal - Outlet renderiza las rutas hijas */}
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};