import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  ]
};

const mockPolizas = [
  {
    id: 1,
    inicioVigencia: '2023-01-01',
    finVigencia: '2024-01-01',
    prima: 30000,
    nombreRamo: 'Automotor',
    nombreCliente: 'Juan Perez',
    tipoPago: 'TARJETA'
  }
];

describe('Dashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dashboardService.getDashboardStats.mockResolvedValue(mockStats);
    polizaService.getPolizas.mockResolvedValue(mockPolizas);
  });

  it('renders loading state initially', () => {
    const { container } = render(<Dashboard />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  it('renders stats and timeline tab by default after loading', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Total de Clientes')).toBeInTheDocument();
    });

    // Check KPI values
    expect(screen.getByText('10')).toBeInTheDocument(); // Clientes
    expect(screen.getByText('5')).toBeInTheDocument(); // Pólizas Activas
    
    // Check default tab content
    expect(screen.getByText('Línea de Tiempo de Emisiones')).toBeInTheDocument();
  });

  it('switches to companies tab when clicked', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Compañías')).toBeInTheDocument();
    });

    const companiesBtn = screen.getByText('Compañías');
    fireEvent.click(companiesBtn);

    expect(screen.getByText('Distribución por Compañía')).toBeInTheDocument();
    expect(screen.queryByText('Línea de Tiempo de Emisiones')).not.toBeInTheDocument();
  });
  
  it('switches to distribution tab when clicked', async () => {
    render(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Distribución de Cartera')).toBeInTheDocument();
    });

    const distBtn = screen.getByText('Distribución de Cartera');
    fireEvent.click(distBtn);

    expect(screen.getByText('Composición por Ramo')).toBeInTheDocument();
    expect(screen.getByText('Medios de Pago')).toBeInTheDocument();
  });
});
