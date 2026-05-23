/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, completa todos los campos');
      return;
    }
    
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/boards');
    } catch (error) {
      // Error ya manejado por el interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center p-4!">
      <div className="bg-white rounded-2xl m-auto! shadow-xl w-full max-w-md p-8! fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Bienvenido</h1>
          <p className="text-gray-600 mt-2!">Inicia sesión para continuar</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={18} />}
            required
          />
          
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={18} />}
            required
          />
          
          <Button
            type="submit"
            variant="primary"
            className="w-full mt-6!"
            isLoading={isLoading}
          >
            Iniciar Sesión
          </Button>
        </form>
        
        <p className="text-center text-sm text-gray-600 mt-6!">
          ¿No tienes una cuenta?{' '}
          <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
};