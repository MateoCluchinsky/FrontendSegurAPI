import { useState } from 'react';
import { descargarExcelPolizas } from '../services/reporteService';
import '../styles/Dashboard.css';

const Reportes = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownloadExcel = async () => {
    try {
      setLoading(true);
      setError(null);
      const blob = await descargarExcelPolizas();
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Reporte_Polizas_SegurAPI.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error("Error al descargar el Excel:", err);
      setError("Hubo un problema al generar el informe. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Reportes y Estadísticas</h1>
        <p className="page-description">Generación de informes exportables y análisis de datos de tus carteras.</p>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '3rem 2rem' }}>
          <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(110, 231, 183, 0.2))', color: '#34d399', marginBottom: '1.5rem', width: '80px', height: '80px', fontSize: '3rem' }}>
            📊
          </div>
          <h3 style={{ color: 'white', marginBottom: '1rem', fontSize: '1.5rem' }}>Reporte General de Pólizas</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Descarga un documento Excel completo con el detalle de todas las pólizas activas en tu cartera agrupadas por cliente, listo para presentar o analizar.
          </p>
          
          <button 
            onClick={handleDownloadExcel} 
            disabled={loading}
            style={{
              background: loading ? 'rgba(59, 130, 246, 0.5)' : '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '1rem 2.5rem',
              borderRadius: '8px',
              fontSize: '1.05rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
            }}
            onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'none')}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white', margin: 0 }}></div>
                Generando...
              </>
            ) : (
              '📄 Generar y Descargar Excel'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
