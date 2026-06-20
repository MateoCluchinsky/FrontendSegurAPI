import { useState, useEffect } from 'react';
import { createCliente, updateCliente, uploadFotoCliente, getLocalidades } from '../services/clienteService';
import '../styles/Clientes.css';

const ClienteModal = ({ isOpen, onClose, cliente, onSave }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    fechaNacimiento: '',
    direccion: '',
    localidadId: '',
    telefono: '',
    email: '',
    dni: '',
    sexo: '',
    tipoIva: ''
  });
  const [localidades, setLocalidades] = useState([]);
  const [fotoFile, setFotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Cargar localidades
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
        fechaNacimiento: cliente.fechaNacimiento || '',
        direccion: cliente.direccion || '',
        localidadId: cliente.localidadId || cliente.localidad?.id || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        dni: cliente.dni || '',
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
    setError('');
  }, [cliente, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFotoFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let savedCliente;
      if (cliente && cliente.id) {
        savedCliente = await updateCliente(cliente.id, formData);
      } else {
        savedCliente = await createCliente(formData);
      }

      const targetId = savedCliente?.id || cliente?.id;

      if (fotoFile && targetId) {
        await uploadFotoCliente(targetId, fotoFile);
      }

      onSave(); 
      onClose(); 
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al guardar el cliente. Verifique los campos obligatorios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>{cliente ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="auth-error">{error}</div>}
            
            <div className="auth-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              <div className="form-group">
                <label>Nombre *</label>
                <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required placeholder="Ej. María" />
              </div>

              <div className="form-group">
                <label>Apellido *</label>
                <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required placeholder="Ej. García" />
              </div>

              <div className="form-group">
                <label>DNI *</label>
                <input type="text" name="dni" value={formData.dni} onChange={handleChange} required placeholder="Sin puntos ni espacios" />
              </div>
              
              <div className="form-group">
                <label>Email *</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="maria@ejemplo.com" />
              </div>

              <div className="form-group">
                <label>Fecha de Nacimiento *</label>
                <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Sexo *</label>
                <select name="sexo" value={formData.sexo} onChange={handleChange} required style={{
                  padding: '0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none'
                }}>
                  <option value="" disabled>Seleccione sexo</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input type="text" name="telefono" value={formData.telefono} onChange={handleChange} placeholder="+54 9 11 1234-5678" />
              </div>

              <div className="form-group">
                <label>Tipo de IVA *</label>
                <select name="tipoIva" value={formData.tipoIva} onChange={handleChange} required style={{
                  padding: '0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none'
                }}>
                  <option value="" disabled>Seleccione IVA</option>
                  <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
                  <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
                  <option value="MONOTRIBUTISTA">Monotributista</option>
                </select>
              </div>

              <div className="form-group">
                <label>Localidad *</label>
                <select name="localidadId" value={formData.localidadId} onChange={handleChange} required style={{
                  padding: '0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none'
                }}>
                  <option value="" disabled>Seleccione Localidad</option>
                  {localidades.map(loc => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nombre} {loc.provincia ? `(${loc.provincia.nombre})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Dirección</label>
                <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} placeholder="Calle 123" />
              </div>
              
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Foto de Perfil</label>
                <div className="file-input-wrapper">
                  <input type="file" accept="image/*" onChange={handleFileChange} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClienteModal;
