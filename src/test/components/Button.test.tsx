import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/ui/Button';
import { describe, it, expect, vi } from 'vitest';

describe('Button Component', () => {
  it('debería renderizar correctamente', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('debería manejar eventos click', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('debería mostrar estado de loading', () => {
    render(<Button isLoading>Click me</Button>);
    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('debería aplicar diferentes variantes', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-indigo-600');
    
    rerender(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');
  });

  it('debería estar deshabilitado cuando se pasa disabled prop', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});