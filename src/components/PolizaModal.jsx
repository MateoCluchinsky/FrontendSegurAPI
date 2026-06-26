/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { createPoliza, updatePoliza, uploadArchivoPoliza, getCompanias, getRamos } from '../services/polizaService';
import { searchClientes } from '../services/clienteService';
import '../styles/Clientes.css';

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
    nroPza: '',
    clienteId: '',
    tipoPago: '',
    inicioVigencia: '',
    finVigencia: '',
    ramoId: '',
    companiaId: '',
    tipoFacturacion: '',
    prima: '',
    premio: ''
  });

  const [archivoFile, setArchivoFile] = useState(null);
  const [companias, setCompanias] = useState([]);
  const [ramos, setRamos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        clienteId: poliza.clienteId || '',
        tipoPago: poliza.tipoPago || '',
        inicioVigencia: formatDateForInput(poliza.inicioVigencia),
        finVigencia: formatDateForInput(poliza.finVigencia),
        ramoId: poliza.ramoId || '',
        companiaId: poliza.companiaId || '',
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
    setError('');
  }, [poliza, isOpen]);

  // Búsqueda en tiempo real (debounce)
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

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setArchivoFile(e.target.files[0]);
    }
  };

  const selectClient = (client) => {
    setFormData({ ...formData, clienteId: client.id });
    setSelectedClientName(client.nombreCompleto || `${client.nombre || ''} ${client.apellido || ''}`.trim());
    setClientSearchQuery('');
    setClientResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clienteId) {
      setError("Debe seleccionar un cliente de la lista.");
      return;
    }
    setLoading(true);
    setError('');

    try {
      let savedPoliza;
      if (poliza && poliza.id) {
        savedPoliza = await updatePoliza(poliza.id, formData);
      } else {
        savedPoliza = await createPoliza(formData);
      }

      const targetId = savedPoliza?.id || poliza?.id;

      if (archivoFile && targetId) {
        await uploadArchivoPoliza(targetId, archivoFile);
      }

      onSave(); 
      onClose(); 
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al guardar la póliza. Verifique los campos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>{poliza ? 'Editar Póliza' : 'Nueva Póliza'}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="auth-error">{error}</div>}
            
            <div className="auth-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              
              <div className="form-group" style={{ gridColumn: '1 / -1', position: 'relative' }}>
                <label>Cliente (Tomador) *</label>
                {selectedClientName ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--primary-color)' }}>
                    <span style={{ color: 'white', flex: 1 }}>{selectedClientName}</span>
                    <button type="button" onClick={() => { setSelectedClientName(''); setFormData({ ...formData, clienteId: '' }); }} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 'bold' }}>
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <>
                    <input 
                      type="text" 
                      placeholder="Buscar cliente por nombre o DNI..." 
                      value={clientSearchQuery} 
                      onChange={(e) => setClientSearchQuery(e.target.value)} 
                      style={{ width: '100%' }}
                    />
                    {isSearching && <small style={{ color: 'var(--text-secondary)' }}>Buscando...</small>}
                    {clientResults.length > 0 && (
                      <ul style={{ 
                        position: 'absolute', top: '100%', left: 0, right: 0, background: '#1e293b', 
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: 0, 
                        listStyle: 'none', maxHeight: '200px', overflowY: 'auto', zIndex: 10,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                      }}>
                        {clientResults.map(client => (
                          <li 
                            key={client.id} 
                            onClick={() => selectClient(client)}
                            style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'white' }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                            onMouseOut={(e) => e.target.style.background = 'transparent'}
                          >
                            <strong>{client.nombreCompleto || `${client.nombre || ''} ${client.apellido || ''}`.trim()}</strong> <br/>
                            <small style={{ color: 'var(--text-secondary)' }}>DNI: {client.dni || 'S/N'}</small>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>

              <div className="form-group">
                <label>Nro de Póliza *</label>
                <input type="text" name="nroPza" value={formData.nroPza} onChange={handleChange} required placeholder="Ej. 123456789" />
              </div>

              <div className="form-group">
                <label>Tipo de Pago *</label>
                <select name="tipoPago" value={formData.tipoPago} onChange={handleChange} required className="custom-select">
                  <option value="" disabled>Seleccione...</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA_CREDITO">Tarjeta de Crédito</option>
                  <option value="TARJETA_DEBITO">Tarjeta de Débito</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Aseguradora *</label>
                <select name="companiaId" value={formData.companiaId} onChange={handleChange} required className="custom-select">
                  <option value="" disabled>Seleccione...</option>
                  {companias.map(comp => <option key={comp.id} value={comp.id}>{comp.nombre}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Ramo *</label>
                <select name="ramoId" value={formData.ramoId} onChange={handleChange} required className="custom-select">
                  <option value="" disabled>Seleccione...</option>
                  {ramos.map(ramo => <option key={ramo.id} value={ramo.id}>{ramo.nombre}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Inicio Vigencia *</label>
                <input type="date" name="inicioVigencia" value={formData.inicioVigencia} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Fin Vigencia *</label>
                <input type="date" name="finVigencia" value={formData.finVigencia} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Prima *</label>
                <input type="number" step="0.01" name="prima" value={formData.prima} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Premio *</label>
                <input type="number" step="0.01" name="premio" value={formData.premio} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label>Tipo Facturación</label>
                <input type="text" name="tipoFacturacion" value={formData.tipoFacturacion} onChange={handleChange} placeholder="Mensual, Anual..." />
              </div>
              
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Documento PDF Adjunto</label>
                <div className="file-input-wrapper">
                  <input type="file" accept="application/pdf" onChange={handleFileChange} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Póliza'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PolizaModal;
