import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

describe('HomePage', () => {
  it('presenta landing pública con enlaces de cliente y propietario', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'Tu próxima cancha empieza aquí' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Reservar ahora' })).toHaveAttribute('href', '/reservas');
    expect(screen.getByRole('link', { name: 'Soy Propietario' })).toHaveAttribute('href', '/login');
  });
});
