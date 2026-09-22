import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getPolizas, deletePoliza } from '../services/polizaService';
import { FILES_URL } from '../services/api';
import PolizaModal from '../components/PolizaModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, FileText, Link as LinkIcon } from 'lucide-react';

const Polizas = () => {
  const queryClient = useQueryClient();
  
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [filtroNroPza, setFiltroNroPza] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [polizaEditing, setPolizaEditing] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['polizas', page, size, filtroNroPza],
    queryFn: () => getPolizas({ page, size, nroPza: filtroNroPza }),
  });

  const content = data?.content || data?.data || data || [];
  const polizas = Array.isArray(content) ? content.filter(p => p.activo !== false) : [];
  const totalPages = data?.totalPages || 1;
  const totalElements = data?.totalElements || polizas.length;

  const deleteMutation = useMutation({
    mutationFn: deletePoliza,
    onSuccess: () => {
      toast.success('Póliza anulada correctamente');
      queryClient.invalidateQueries({ queryKey: ['polizas'] });
    },
    onError: (err) => {
      console.error("Error al anular", err);
      toast.error('Hubo un error al anular la póliza.');
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    setFiltroNroPza(searchInput);
  };

  const handleOpenModal = (poliza = null) => {
    setPolizaEditing(poliza);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPolizaEditing(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que deseas anular esta póliza?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T12:00:00Z');
    return date.toLocaleDateString('es-AR');
  };

  const handleShare = async (poliza) => {
    const shareData = {
      title: `Póliza ${poliza.nroPza} - SegurAPI`,
      text: `Datos de Póliza:\n- Nro: ${poliza.nroPza}\n- Cliente: ${poliza.nombreCliente}\n- Compañía: ${poliza.nombreCompania}\n- Ramo: ${poliza.nombreRamo}\n- Inicio de Vigencia: ${formatDate(poliza.inicioVigencia)}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        navigator.clipboard.writeText(shareData.text);
        toast.info('Datos copiados al portapapeles. (Navegador sin Web Share API)');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error al compartir', err);
      }
    }
  };

  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: ['polizas'] });
    handleCloseModal();
  };

  return (
    <div className="flex flex-col gap-6 p-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Control de Pólizas</h1>
          <p className="text-muted-foreground mt-1">Visualiza y gestiona las pólizas de seguros emitidas.</p>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-2">
          <form onSubmit={handleSearch} className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Buscar por número..." 
              className="pl-9 w-full bg-background"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          <Button onClick={() => handleOpenModal()} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Nueva Póliza
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Listado de Pólizas</CardTitle>
          <CardDescription>
            {totalElements} pólizas activas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nro Póliza</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Aseguradora</TableHead>
                  <TableHead>Ramo</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Prima</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-[120px] ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-destructive">
                      Ocurrió un problema al cargar las pólizas.
                      <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">Reintentar</Button>
                    </TableCell>
                  </TableRow>
                ) : polizas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No se encontraron pólizas.
                    </TableCell>
                  </TableRow>
                ) : (
                  polizas.map((poliza) => (
                    <TableRow key={poliza.id} className="group">
                      <TableCell className="font-semibold text-primary">{poliza.nroPza}</TableCell>
                      <TableCell className="font-medium">{poliza.nombreCliente}</TableCell>
                      <TableCell>{poliza.nombreCompania}</TableCell>
                      <TableCell>{poliza.nombreRamo}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs space-y-1">
                          <span className="text-emerald-500 font-medium">Desde: {formatDate(poliza.inicioVigencia)}</span>
                          <span className="text-rose-500 font-medium">Hasta: {formatDate(poliza.finVigencia)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(poliza.prima)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {poliza.documentoUrl && (
                            <Button variant="ghost" size="icon" asChild className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10">
                              <a href={poliza.documentoUrl.startsWith('http') ? poliza.documentoUrl : `${FILES_URL}${poliza.documentoUrl}`} target="_blank" rel="noreferrer">
                                <FileText className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleShare(poliza)} className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                            <LinkIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(poliza)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(poliza.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {!isLoading && totalPages > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando página {page + 1} de {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page === 0} 
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={page >= totalPages - 1} 
                  onClick={() => setPage(page + 1)}
                >
                  Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PolizaModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        poliza={polizaEditing} 
        onSave={handleSave} 
      />
    </div>
  );
};

export default Polizas;
