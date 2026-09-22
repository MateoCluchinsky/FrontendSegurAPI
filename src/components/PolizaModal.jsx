/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { createPoliza, updatePoliza, uploadArchivoPoliza, getCompanias, getRamos } from '../services/polizaService';
import { searchClientes } from '../services/clienteService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

const formatDateForInput = (dateArrayOrString) => {
  if (!dateArrayOrString) return '';
  if (Array.isArray(dateArrayOrString)) {
    const [year, month, day] = dateArrayOrString;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  return String(dateArrayOrString).substring(0, 10);
};

const PolizaModal = ({ isOpen, onClose, poliza, onSave }) => {
  const [formData, setFormData] = useState({
    nroPza: '', clienteId: '', tipoPago: '', inicioVigencia: '',
    finVigencia: '', ramoId: '', companiaId: '', tipoFacturacion: '',
    prima: '', premio: ''
  });

  const [archivoFile, setArchivoFile] = useState(null);
  const [companias, setCompanias] = useState([]);
  const [ramos, setRamos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lógica de autocompletado
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientResults, setClientResults] = useState([]);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const fetchSelectData = async () => {
      try {
        const [companiasData, ramosData] = await Promise.all([
          getCompanias(),
          getRamos()
        ]);
        setCompanias(companiasData || []);
        setRamos(ramosData || []);
      } catch (err) {
        console.error("Error fetching companias/ramos", err);
      }
    };
    if (isOpen) fetchSelectData();
  }, [isOpen]);

  useEffect(() => {
    if (poliza) {
      setFormData({
        nroPza: poliza.nroPza || '',
        clienteId: String(poliza.clienteId || ''),
        tipoPago: poliza.tipoPago || '',
        inicioVigencia: formatDateForInput(poliza.inicioVigencia),
        finVigencia: formatDateForInput(poliza.finVigencia),
        ramoId: String(poliza.ramoId || ''),
        companiaId: String(poliza.companiaId || ''),
        tipoFacturacion: poliza.tipoFacturacion || '',
        prima: poliza.prima || '',
        premio: poliza.premio || ''
      });
      setSelectedClientName(poliza.nombreCliente || '');
      setClientSearchQuery('');
      setArchivoFile(null);
    } else {
      setFormData({
        nroPza: '', clienteId: '', tipoPago: '', inicioVigencia: '',
        finVigencia: '', ramoId: '', companiaId: '', tipoFacturacion: '',
        prima: '', premio: ''
      });
      setSelectedClientName('');
      setClientSearchQuery('');
      setArchivoFile(null);
    }
  }, [poliza, isOpen]);

  useEffect(() => {
    if (clientSearchQuery.length < 2) {
      setClientResults([]);
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchClientes(clientSearchQuery);
        setClientResults(results);
      } catch (err) {
        console.error("Error buscando clientes", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [clientSearchQuery]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoFile(e.target.files[0]);
    }
  };

  const selectClient = (client) => {
    setFormData({ ...formData, clienteId: String(client.id) });
    setSelectedClientName(client.nombreCompleto || `${client.nombre || ''} ${client.apellido || ''}`.trim());
    setClientSearchQuery('');
    setClientResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clienteId) {
      toast.error("Debe seleccionar un cliente de la lista.");
      return;
    }
    setLoading(true);

    try {
      let savedPoliza;
      if (poliza && poliza.id) {
        savedPoliza = await updatePoliza(poliza.id, formData);
        toast.success("Póliza actualizada exitosamente.");
      } else {
        savedPoliza = await createPoliza(formData);
        toast.success("Póliza creada exitosamente.");
      }

      const targetId = savedPoliza?.id || poliza?.id;

      if (archivoFile && targetId) {
        await uploadArchivoPoliza(targetId, archivoFile);
      }

      onSave(); 
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error al guardar la póliza. Verifique los campos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{poliza ? 'Editar Póliza' : 'Nueva Póliza'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="grid gap-2 md:col-span-2 relative">
              <Label>Cliente (Tomador) *</Label>
              {selectedClientName ? (
                <div className="flex items-center gap-4 bg-muted p-3 rounded-md border border-primary">
                  <span className="flex-1 font-medium">{selectedClientName}</span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
                    onClick={() => { setSelectedClientName(''); setFormData({ ...formData, clienteId: '' }); }}
                  >
                    Cambiar
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      type="text" 
                      placeholder="Buscar cliente por nombre o DNI..." 
                      className="pl-9 w-full"
                      value={clientSearchQuery} 
                      onChange={(e) => setClientSearchQuery(e.target.value)} 
                    />
                  </div>
                  {isSearching && <p className="text-xs text-muted-foreground mt-1">Buscando...</p>}
                  {clientResults.length > 0 && (
                    <ul className="absolute top-full left-0 right-0 bg-popover border border-border rounded-md shadow-md mt-1 z-50 max-h-[200px] overflow-y-auto">
                      {clientResults.map(client => (
                        <li 
                          key={client.id} 
                          onClick={() => selectClient(client)}
                          className="p-3 cursor-pointer hover:bg-accent hover:text-accent-foreground border-b border-border/50 last:border-0"
                        >
                          <div className="font-semibold">{client.nombreCompleto || `${client.nombre || ''} ${client.apellido || ''}`.trim()}</div>
                          <div className="text-xs text-muted-foreground">DNI: {client.dni || 'S/N'}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="nroPza">Nro de Póliza *</Label>
              <Input id="nroPza" name="nroPza" value={formData.nroPza} onChange={handleChange} required placeholder="Ej. 123456789" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipoPago">Tipo de Pago *</Label>
              <Select value={formData.tipoPago} onValueChange={(v) => handleSelectChange('tipoPago', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione pago" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EFECTIVO">Efectivo</SelectItem>
                  <SelectItem value="TARJETA_CREDITO">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="TARJETA_DEBITO">Tarjeta de Débito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="companiaId">Aseguradora *</Label>
              <Select value={formData.companiaId} onValueChange={(v) => handleSelectChange('companiaId', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione aseguradora" />
                </SelectTrigger>
                <SelectContent>
                  {companias.map(comp => (
                    <SelectItem key={comp.id} value={String(comp.id)}>{comp.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ramoId">Ramo *</Label>
              <Select value={formData.ramoId} onValueChange={(v) => handleSelectChange('ramoId', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione ramo" />
                </SelectTrigger>
                <SelectContent>
                  {ramos.map(ramo => (
                    <SelectItem key={ramo.id} value={String(ramo.id)}>{ramo.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="inicioVigencia">Inicio Vigencia *</Label>
              <Input id="inicioVigencia" type="date" name="inicioVigencia" value={formData.inicioVigencia} onChange={handleChange} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="finVigencia">Fin Vigencia *</Label>
              <Input id="finVigencia" type="date" name="finVigencia" value={formData.finVigencia} onChange={handleChange} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="prima">Prima *</Label>
              <Input id="prima" type="number" step="0.01" name="prima" value={formData.prima} onChange={handleChange} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="premio">Premio *</Label>
              <Input id="premio" type="number" step="0.01" name="premio" value={formData.premio} onChange={handleChange} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipoFacturacion">Tipo Facturación</Label>
              <Input id="tipoFacturacion" name="tipoFacturacion" value={formData.tipoFacturacion} onChange={handleChange} placeholder="Mensual, Anual..." />
            </div>
            
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="archivo">Documento PDF Adjunto</Label>
              <Input id="archivo" type="file" accept="application/pdf" onChange={handleFileChange} />
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Póliza'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PolizaModal;
