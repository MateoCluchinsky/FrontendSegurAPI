/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { createCliente, updateCliente, uploadFotoCliente, getLocalidades } from '../services/clienteService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const formatDateForInput = (dateArrayOrString) => {
  if (!dateArrayOrString) return '';
  if (Array.isArray(dateArrayOrString)) {
    const [year, month, day] = dateArrayOrString;
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }
  return String(dateArrayOrString).substring(0, 10);
};

const ClienteModal = ({ isOpen, onClose, cliente, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '', apellido: '', fechaNacimiento: '', direccion: '',
    localidadId: '', telefono: '', email: '', dni: '', sexo: '', tipoIva: ''
  });
  const [localidades, setLocalidades] = useState([]);
  const [fotoFile, setFotoFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLocalidades = async () => {
      try {
        const data = await getLocalidades();
        setLocalidades(data);
      } catch (err) {
        console.error("Error al cargar localidades", err);
      }
    };
    if (isOpen) fetchLocalidades();
  }, [isOpen]);

  useEffect(() => {
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        fechaNacimiento: formatDateForInput(cliente.fechaNacimiento),
        direccion: cliente.direccion || '',
        localidadId: String(cliente.localidadId || cliente.localidad?.id || ''),
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        dni: String(cliente.dni || ''),
        sexo: cliente.sexo || '',
        tipoIva: cliente.tipoIva || ''
      });
      setFotoFile(null);
    } else {
      setFormData({
        nombre: '', apellido: '', fechaNacimiento: '', direccion: '',
        localidadId: '', telefono: '', email: '', dni: '', sexo: '', tipoIva: ''
      });
      setFotoFile(null);
    }
  }, [cliente, isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let savedCliente;
      if (cliente && cliente.id) {
        savedCliente = await updateCliente(cliente.id, formData);
        toast.success("Cliente actualizado exitosamente.");
      } else {
        savedCliente = await createCliente(formData);
        toast.success("Cliente creado exitosamente.");
      }

      const targetId = savedCliente?.id || cliente?.id;
      if (fotoFile && targetId) {
        await uploadFotoCliente(targetId, fotoFile);
      }

      onSave(); 
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error al guardar el cliente. Verifique los campos obligatorios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej. María" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="apellido">Apellido *</Label>
              <Input id="apellido" name="apellido" value={formData.apellido} onChange={handleChange} required placeholder="Ej. García" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dni">DNI *</Label>
              <Input id="dni" name="dni" value={formData.dni} onChange={handleChange} required placeholder="Sin puntos ni espacios" />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="maria@ejemplo.com" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fechaNacimiento">Fecha de Nacimiento *</Label>
              <Input id="fechaNacimiento" type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sexo">Sexo *</Label>
              <Select value={formData.sexo} onValueChange={(v) => handleSelectChange('sexo', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione sexo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MASCULINO">Masculino</SelectItem>
                  <SelectItem value="FEMENINO">Femenino</SelectItem>
                  <SelectItem value="OTRO">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="+54 9 11 1234-5678" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipoIva">Tipo de IVA *</Label>
              <Select value={formData.tipoIva} onValueChange={(v) => handleSelectChange('tipoIva', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione IVA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONSUMIDOR_FINAL">Consumidor Final</SelectItem>
                  <SelectItem value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</SelectItem>
                  <SelectItem value="MONOTRIBUTISTA">Monotributista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="localidadId">Localidad *</Label>
              <Select value={formData.localidadId} onValueChange={(v) => handleSelectChange('localidadId', v)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione Localidad" />
                </SelectTrigger>
                <SelectContent>
                  {localidades.map(loc => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.nombre} {loc.provincia ? `(${loc.provincia.nombre})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Calle 123" />
            </div>
            
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="foto">Foto de Perfil</Label>
              <Input id="foto" type="file" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClienteModal;
