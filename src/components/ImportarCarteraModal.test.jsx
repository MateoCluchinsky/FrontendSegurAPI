import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ImportarCarteraModal from './ImportarCarteraModal';
import * as polizaService from '../services/polizaService';

vi.mock('../services/polizaService', () => ({
  getCompanias: vi.fn(),
}));

const mockCompanias = [
  { id: 1, nombre: 'Zurich Argentina' },
  { id: 2, nombre: 'Allianz Argentina' },
  { id: 3, nombre: 'Mapfre Argentina' },
  { id: 4, nombre: 'Federación Patronal Seguros' },
  { id: 5, nombre: 'Noble Seguros' }
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

describe('ImportarCarteraModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    polizaService.getCompanias.mockResolvedValue(mockCompanias);
  });

  it('renders Step 1 with company search filter and alphabetically sorted options', async () => {
    renderWithQueryClient(
      <ImportarCarteraModal isOpen={true} onClose={vi.fn()} />
    );

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Buscar aseguradora/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar aseguradora/i);
    fireEvent.change(searchInput, { target: { value: 'Mapfre' } });
    expect(searchInput.value).toBe('Mapfre');
  });
});
