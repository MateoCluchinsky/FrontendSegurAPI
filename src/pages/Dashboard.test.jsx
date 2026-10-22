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
  totalPremios: 150000,
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
    premio: 30000,
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

  it('renders range filter buttons and allows selecting quick ranges', async () => {
    const statsWithMeses = {
      ...mockStats,
      polizasPorMes: [
        { anio: 2024, mes: 1, cantidad: 5, totalPremio: 150000 },
        { anio: 2026, mes: 3, cantidad: 8, totalPremio: 250000 }
      ]
    };
    dashboardService.getDashboardStats.mockResolvedValue(statsWithMeses);
    renderWithQueryClient(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Todo el historial')).toBeInTheDocument();
      expect(screen.getByText('Últimos 12 meses')).toBeInTheDocument();
      expect(screen.getByText('Año 2026')).toBeInTheDocument();
      expect(screen.getByText('Últimos 3 años')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Año 2026'));
    expect(screen.getByText('Año 2026')).toHaveClass('bg-card');
  });

  it('opens and closes fullscreen dialog when expand button is clicked', async () => {
    renderWithQueryClient(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTitle('Expandir a pantalla completa')).toBeInTheDocument();
    });

    const expandBtn = screen.getByTitle('Expandir a pantalla completa');
    fireEvent.click(expandBtn);

    expect(screen.getByText('Evolución Histórica de Pólizas y Premios')).toBeInTheDocument();

    const minimizeBtn = screen.getByTitle('Minimizar');
    fireEvent.click(minimizeBtn);

    await waitFor(() => {
      expect(screen.queryByText('Curva histórica mensual con zoom interactivo y filtrado por fecha')).not.toBeInTheDocument();
    });
  });

  it('allows toggling between viewing by premios and cantidad', async () => {
    renderWithQueryClient(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Premios ($)')).toBeInTheDocument();
      expect(screen.getByText('Cantidad')).toBeInTheDocument();
    });

    expect(screen.getByText('Evolución mensual de premios emitidos por período')).toBeInTheDocument();

    const cantidadBtn = screen.getByText('Cantidad');
    fireEvent.click(cantidadBtn);

    expect(screen.getByText('Evolución mensual de cantidad de pólizas emitidas por período')).toBeInTheDocument();

    const premiosBtn = screen.getByText('Premios ($)');
    fireEvent.click(premiosBtn);

    expect(screen.getByText('Evolución mensual de premios emitidos por período')).toBeInTheDocument();
  });
});


