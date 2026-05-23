import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { Input } from '../../components/ui/Input';

describe('Input Component', () => {
  it('debería renderizar correctamente', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('debería mostrar label cuando se proporciona', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('debería manejar cambios de valor', () => {
    const handleChange = vi.fn();
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test value' } });
    
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('debería mostrar mensaje de error', () => {
    render(<Input error="Campo requerido" />);
    expect(screen.getByText('Campo requerido')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveClass('border-red-500');
  });

  it('debería mostrar icono cuando se proporciona', () => {
    const IconMock = () => <span data-testid="icon">🔍</span>;
    render(<Input icon={<IconMock />} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('debería estar deshabilitado cuando se pasa disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});