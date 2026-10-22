import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Polizas from './Polizas';
import * as polizaService from '../services/polizaService';

// Mock the services
vi.mock('../services/polizaService', () => ({
  getPolizas: vi.fn(),
  deletePoliza: vi.fn()
}));

const mockPolizasResponse = {
  content: [
    {
      id: 1,
      nroPza: '10001',
      nroEndoso: 0,
      nombreCliente: 'Juan Perez',
      nombreCompania: 'Mapfre',
      nombreRamo: 'Vida Colectivo',
      inicioVigencia: '2024-01-01',
      finVigencia: '2025-01-01',
      premio: 0,
      activo: true
    },
    {
      id: 2,
      nroPza: '10002',
      nroEndoso: 1,
      nombreCliente: 'Maria Gomez',
      nombreCompania: 'Federacion Patronal',
      nombreRamo: 'Automotor',
      inicioVigencia: '2024-03-01',
      finVigencia: '2025-03-01',
      premio: 85000.5,
      activo: true
    }
  ],
  totalElements: 2,
  totalPages: 1
};

const renderWithQueryClient = (ui) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('Polizas Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    polizaService.getPolizas.mockResolvedValue(mockPolizasResponse);
  });

  it('renders polizas list and shows badge S/D ($0 en origen) for zero premio', async () => {
    renderWithQueryClient(<Polizas />);

    await waitFor(() => {
      expect(screen.getByText('10001')).toBeInTheDocument();
      expect(screen.getByText('10002')).toBeInTheDocument();
    });

    // Policy with premio 0 displays badge
    expect(screen.getByText('S/D ($0 en origen)')).toBeInTheDocument();

    // Policy with normal premio displays formatted currency
    expect(screen.getByText(/85\.000/)).toBeInTheDocument();
  });

  it('toggles "Ocultar pólizas en $0" button and refetches with filter', async () => {
    renderWithQueryClient(<Polizas />);

    await waitFor(() => {
      expect(screen.getByText('Ocultar pólizas en $0')).toBeInTheDocument();
    });

    const hideZeroBtn = screen.getByText('Ocultar pólizas en $0');
    fireEvent.click(hideZeroBtn);

    await waitFor(() => {
      expect(polizaService.getPolizas).toHaveBeenCalledWith(
        expect.objectContaining({
          ocultarPremioCero: true,
          sort: 'premio,desc'
        })
      );
    });
  });

  it('renders sort selector in filter bar', async () => {
    renderWithQueryClient(<Polizas />);

    await waitFor(() => {
      expect(screen.getByText('Mayor Premio')).toBeInTheDocument();
    });
  });
});
