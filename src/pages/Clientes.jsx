import { useState, useEffect, useCallback } from 'react';
import { getClientesPaginados, deleteCliente } from '../services/clienteService';
import { FILES_URL } from '../services/api';
import ClienteModal from '../components/ClienteModal';
import '../styles/Clientes.css';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  
  // Paginación y Búsqueda
  const [page, setPage] = useState(0);
  const [size] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [filtro, setFiltro] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clienteEditing, setClienteEditing] = useState(null);

  const fetchClientes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getClientesPaginados(filtro, page, size);
      
      // Manejo seguro por si el backend devuelve un Page<T> de Spring Boot
      const content = data.content || data.data || data;
      
      setClientes(Array.isArray(content) ? content.filter(c => c.activo !== false) : []);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements || (Array.isArray(content) ? content.length : 0));
      setFetchError(null);
    } catch (err) {
      console.error("Error al obtener clientes", err);
      setFetchError("Ocurrió un problema de red al cargar los clientes. El servidor podría estar fuera de servicio.");
      setClientes([]);
    } finally {
      setLoading(false);
    }
  }, [filtro, page, size]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClientes();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchClientes]);

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

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas dar de baja este cliente?')) {
      try {
        await deleteCliente(id);
        fetchClientes();
      } catch (err) {
        console.error("Error al eliminar", err);
        alert('Hubo un error al eliminar el cliente.');
      }
    }
  };

  // URL base extraída del interceptor API
  const filesUrl = FILES_URL;

  return (
    <div className="clientes-container">
      <div className="page-header" style={{ marginBottom: '0' }}>
        <h1 className="page-title">Gestión de Clientes</h1>
        <p className="page-description">Administra el listado de clientes, su información y fotos de perfil.</p>
      </div>

      <div className="clientes-header-actions">
        <form onSubmit={handleSearch} className="search-box">
          <span>🔍</span>
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </form>
        
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <span>➕</span> Añadir Cliente
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Perfil</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>DNI</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                  <div className="spinner" style={{ margin: '0 auto', width: '30px', height: '30px' }}></div>
                </td>
              </tr>
            ) : fetchError ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', padding: '1.5rem', display: 'inline-block', color: '#f87171' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>❌ Error de Conexión</p>
                    <p style={{ margin: 0, fontSize: '0.9rem' }}>{fetchError}</p>
                    <button onClick={fetchClientes} style={{ marginTop: '1rem', background: '#ef4444', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}>Reintentar</button>
                  </div>
                </td>
              </tr>
            ) : clientes.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  No se encontraron clientes.
                </td>
              </tr>
            ) : (
              clientes.map(cliente => (
                <tr key={cliente.id}>
                  <td>
                    {cliente.fotoUrl ? (
                      <img 
                        src={`${filesUrl}/${cliente.fotoUrl}`} 
                        alt={cliente.nombre} 
                        className="client-avatar"
                        onError={(e) => { 
                          e.target.onerror = null; 
                          e.target.src = ''; 
                          e.target.className = 'client-avatar-placeholder'; 
                        }}
                      />
                    ) : (
                      <div className="client-avatar-placeholder">
                        {cliente.nombre ? cliente.nombre.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </td>
                  <td style={{ fontWeight: 500, color: 'white' }}>{cliente.nombre}</td>
                  <td>{cliente.email}</td>
                  <td>{cliente.telefono || '-'}</td>
                  <td>{cliente.dni || '-'}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon edit" title="Editar" onClick={() => handleOpenModal(cliente)}>
                        ✏️
                      </button>
                      <button className="btn-icon delete" title="Dar de Baja" onClick={() => handleDelete(cliente.id)}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {/* Controles de Paginación */}
        {!loading && totalPages > 0 && (
          <div className="pagination">
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Total: {totalElements} clientes
            </span>
            <div className="pagination-controls">
              <button 
                className="btn-page" 
                disabled={page === 0} 
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </button>
              <span style={{ fontWeight: 600 }}>Página {page + 1} de {totalPages}</span>
              <button 
                className="btn-page" 
                disabled={page >= totalPages - 1} 
                onClick={() => setPage(page + 1)}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      <ClienteModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        cliente={clienteEditing} 
        onSave={fetchClientes} 
      />
    </div>
  );
};

export default Clientes;
