import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClientesPaginados, deleteCliente } from '../services/clienteService';
import { FILES_URL } from '../services/api';
import ClienteModal from '../components/ClienteModal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Search, Plus, Edit, Trash2, ChevronLeft, ChevronRight, User } from 'lucide-react';

const Clientes = () => {
  const queryClient = useQueryClient();
  
  // Paginación y Búsqueda
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [filtro, setFiltro] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteEditing, setClienteEditing] = useState(null);

  // UseQuery para obtener clientes
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clientes', page, size, filtro],
    queryFn: () => getClientesPaginados(filtro, page, size),
  });

  const content = data?.content || data?.data || data || [];
  const clientes = Array.isArray(content) ? content.filter(c => c.activo !== false) : [];
  const totalPages = data?.totalPages || 1;
  const totalElements = data?.totalElements || clientes.length;

  // UseMutation para eliminar
  const deleteMutation = useMutation({
    mutationFn: deleteCliente,
    onSuccess: () => {
      toast.success('Cliente dado de baja correctamente');
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
    },
    onError: (err) => {
      console.error("Error al eliminar", err);
      toast.error('Hubo un error al eliminar el cliente.');
    }
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0); // Reiniciar a la primera página al filtrar
    setFiltro(searchInput);
  };

  const handleOpenModal = (cliente = null) => {
    setClienteEditing(cliente);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setClienteEditing(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de que deseas dar de baja este cliente?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSave = () => {
    // Cuando el modal guarda un cliente, invalidar caché y cerrar
    queryClient.invalidateQueries({ queryKey: ['clientes'] });
    handleCloseModal();
  };

  return (
    <div className="flex flex-col gap-6 p-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes</h1>
          <p className="text-muted-foreground mt-1">Administra el listado de clientes y su información.</p>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-2">
          <form onSubmit={handleSearch} className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Buscar por nombre..." 
              className="pl-9 w-full bg-background"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </form>
          <Button onClick={() => handleOpenModal()} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" /> Añadir Cliente
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Listado de Clientes</CardTitle>
          <CardDescription>
            {totalElements} clientes activos en la base de datos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px] text-center">Perfil</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      <TableCell><Skeleton className="h-10 w-10 rounded-full mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-[80px] ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-destructive">
                      Ocurrió un problema al cargar los clientes.
                      <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-4">Reintentar</Button>
                    </TableCell>
                  </TableRow>
                ) : clientes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      No se encontraron clientes.
                    </TableCell>
                  </TableRow>
                ) : (
                  clientes.map((cliente) => (
                    <TableRow key={cliente.id} className="group">
                      <TableCell className="text-center">
                        {cliente.fotoUrl ? (
                          <img 
                            src={`${FILES_URL}/${cliente.fotoUrl}`} 
                            alt={cliente.nombre} 
                            className="h-10 w-10 rounded-full object-cover mx-auto"
                            onError={(e) => { 
                              e.target.onerror = null; 
                              e.target.src = ''; 
                              e.target.className = 'hidden'; 
                              e.target.nextSibling.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto ${cliente.fotoUrl ? 'hidden' : ''}`}>
                          <User className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{cliente.nombre} {cliente.apellido}</TableCell>
                      <TableCell>{cliente.email}</TableCell>
                      <TableCell>{cliente.telefono || '-'}</TableCell>
                      <TableCell>{cliente.dni || '-'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenModal(cliente)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(cliente.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
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

      <ClienteModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        cliente={clienteEditing} 
        onSave={handleSave} 
      />
    </div>
  );
};

export default Clientes;
