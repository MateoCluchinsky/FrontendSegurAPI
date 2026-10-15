/* eslint-disable no-undef */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './Dashboard';
import * as dashboardService from '../services/dashboardService';
import * as polizaService from '../services/polizaService';

// Mock the services
vi.mock('../services/dashboardService', () => ({
  getDashboardStats: vi.fn()
}));
vi.mock('../services/polizaService', () => ({
  getPolizas: vi.fn()
}));

// ResizeObserver mock for Recharts responsive container
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const mockStats = {
  cantClientesActivos: 10,
  totalPrimas: 150000,
  cantPolizasActivas: 5,
  polizasPorCompania: [
    { nombre: 'Sancor', cantidad: 2 },
    { nombre: 'Sura', cantidad: 3 }
  ],
  polizasPorRamo: [{ nombre: 'Automotor', cantidad: 3 }],
  polizasPorTipoPago: [{ tipoPago: 'TARJETA_CREDITO', cantidad: 3 }]
};

const mockPolizas = [
  {
    id: 1,
    inicioVigencia: '2023-01-01',
    finVigencia: '2024-01-01',
    prima: 30000,
    nombreRamo: 'Automotor',
    nombreCliente: 'Juan Perez',
    tipoPago: 'TARJETA_CREDITO'
  }
];

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

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dashboardService.getDashboardStats.mockResolvedValue(mockStats);
    polizaService.getPolizas.mockResolvedValue(mockPolizas);
  });

  it('renders loading state initially', () => {
    const { container } = renderWithQueryClient(<Dashboard />);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('renders stats and timeline tab by default after loading', async () => {
    renderWithQueryClient(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Total de Clientes')).toBeInTheDocument();
    });

    // Check KPI values
    expect(screen.getByText('10')).toBeInTheDocument(); // Clientes
    expect(screen.getByText('5')).toBeInTheDocument(); // Pólizas Activas
    
    // Check default tab content (both tab button and card title have 'Emisión de Pólizas')
    const timelineElements = screen.getAllByText('Emisión de Pólizas');
    expect(timelineElements.length).toBeGreaterThanOrEqual(1);
  });

  it('switches to companies tab when clicked', async () => {
    renderWithQueryClient(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Compañías' })).toBeInTheDocument();
    });

    const companiesBtn = screen.getByRole('button', { name: 'Compañías' });
    fireEvent.click(companiesBtn);

    expect(screen.getByText('Distribución por Compañía')).toBeInTheDocument();
  });
  
  it('switches to distribution tab when clicked', async () => {
    renderWithQueryClient(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Distribución' })).toBeInTheDocument();
    });

    const distBtn = screen.getByRole('button', { name: 'Distribución' });
    fireEvent.click(distBtn);

    expect(screen.getByText('Composición por Ramo')).toBeInTheDocument();
    expect(screen.getByText('Medios de Pago')).toBeInTheDocument();
  });
});
