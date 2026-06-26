import { useState, useEffect, useCallback } from 'react';
import { getPolizas, deletePoliza } from '../services/polizaService';
import PolizaModal from '../components/PolizaModal';
import '../styles/Clientes.css';

const Polizas = () => {
  const [polizas, setPolizas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [polizaEditing, setPolizaEditing] = useState(null);

  const fetchPolizas = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getPolizas();
      
      const content = data.content || data.data || data;
      setPolizas(Array.isArray(content) ? content : []);
    } catch (err) {
      console.error("Error al obtener pólizas", err);
      setPolizas([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPolizas();
  }, [fetchPolizas]);

  const handleOpenModal = (poliza = null) => {
    setPolizaEditing(poliza);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPolizaEditing(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas anular esta póliza?')) {
      try {
        await deletePoliza(id);
        fetchPolizas();
      } catch (err) {
        console.error("Error al anular", err);
        alert('Hubo un error al anular la póliza.');
      }
    }
  };

  const filesUrl = import.meta.env.VITE_FILES_URL || 'http://localhost:8080/api/uploads';

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    // Fix timezone offset issues when rendering dates
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
        // Fallback si el navegador no soporta Web Share API
        navigator.clipboard.writeText(shareData.text);
        alert('Datos copiados al portapapeles. (Tu navegador no soporta el menú nativo de compartir)');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error al compartir', err);
      }
    }
  };

  return (
    <div className="clientes-container">
      <div className="page-header" style={{ marginBottom: '0' }}>
        <h1 className="page-title">Control de Pólizas</h1>
        <p className="page-description">Visualiza y gestiona las pólizas de seguros emitidas.</p>
      </div>

      <div className="clientes-header-actions" style={{ justifyContent: 'flex-end' }}>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <span>➕</span> Nueva Póliza
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nro Póliza</th>
              <th>Cliente</th>
              <th>Aseguradora</th>
              <th>Ramo</th>
              <th>Vigencia</th>
              <th>Prima</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto', width: '30px', height: '30px' }}></div>
                </td>
              </tr>
            ) : polizas.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No se encontraron pólizas.
                </td>
              </tr>
            ) : (
              polizas.map(poliza => (
                <tr key={poliza.id}>
                  <td style={{ fontWeight: 600, color: '#818cf8' }}>{poliza.nroPza}</td>
                  <td style={{ fontWeight: 500, color: 'white' }}>{poliza.nombreCliente}</td>
                  <td>{poliza.nombreCompania}</td>
                  <td>{poliza.nombreRamo}</td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>
                      <span style={{ color: '#34d399' }}>{formatDate(poliza.inicioVigencia)}</span> a <br/>
                      <span style={{ color: '#f87171' }}>{formatDate(poliza.finVigencia)}</span>
                    </div>
                  </td>
                  <td>{formatCurrency(poliza.prima)}</td>
                  <td>
                    <div className="action-buttons">
                      {poliza.documentoUrl && (
                        <a 
                          href={poliza.documentoUrl.startsWith('http') ? poliza.documentoUrl : `${filesUrl}${poliza.documentoUrl}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn-icon" 
                          title="Descargar PDF"
                          style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.2)', textDecoration: 'none' }}
                        >
                          📄
                        </a>
                      )}
                      <button className="btn-icon" title="Compartir" onClick={() => handleShare(poliza)} style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                        🔗
                      </button>
                      <button className="btn-icon edit" title="Editar" onClick={() => handleOpenModal(poliza)}>
                        ✏️
                      </button>
                      <button className="btn-icon delete" title="Anular" onClick={() => handleDelete(poliza.id)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PolizaModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        poliza={polizaEditing} 
        onSave={fetchPolizas} 
      />
    </div>
  );
};

export default Polizas;
