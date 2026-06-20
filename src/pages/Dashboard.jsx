import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/dashboardService';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("No se pudieron cargar las estadísticas. Verifica tu conexión al servidor.");
        
        // Datos mockeados temporalmente para visualizar la interfaz si falla el backend
        setStats({
          totalClientes: 0,
          primasAcumuladas: 0,
          polizasPorMes: [],
          polizasPorCompania: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Formateadores
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('es-AR').format(value || 0);
  };

  // Valores seguros en caso de que la respuesta sea diferente
  const totalClientes = stats?.totalClientes || 0;
  const primas = stats?.primasAcumuladas || 0;
  const porMes = stats?.polizasPorMes || [];
  const porCompania = stats?.polizasPorCompania || [];

  return (
    <div className="dashboard-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-description">Resumen general y métricas principales de SegurAPI.</p>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Tarjetas KPI */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <span className="kpi-label">Total de Clientes</span>
            <h3 className="kpi-value">{formatNumber(totalClientes)}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(110, 231, 183, 0.2))', color: '#34d399' }}>
            💰
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Primas Acumuladas</span>
            <h3 className="kpi-value">{formatCurrency(primas)}</h3>
          </div>
        </div>
        
        {/* Un kpi extra derivado de los datos (Pólizas Totales Activas) */}
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 197, 253, 0.2))', color: '#60a5fa' }}>
            🛡️
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Pólizas Activas</span>
            <h3 className="kpi-value">
              {formatNumber(porMes.reduce((acc, curr) => acc + (curr.cantidad || 0), 0) || 0)}
            </h3>
          </div>
        </div>
      </div>

      {/* Gráficos Mockeados */}
      <div className="charts-grid">
        
        {/* Gráfico: Pólizas por Mes */}
        <div className="chart-card">
          <h3 className="chart-header">Pólizas por Mes</h3>
          {porMes.length > 0 ? (
            <div className="mock-bar-list">
              {porMes.map((item, index) => {
                const maxVal = Math.max(...porMes.map(i => i.cantidad || 0), 1);
                const width = `${((item.cantidad || 0) / maxVal) * 100}%`;
                
                return (
                  <div className="mock-bar-item" key={index}>
                    <span className="mock-bar-label">{item.mes || `Mes ${index+1}`}</span>
                    <div className="mock-bar-track">
                      <div className="mock-bar-fill" style={{ width }}></div>
                    </div>
                    <span className="mock-bar-value">{item.cantidad || 0}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{color: 'var(--text-secondary)'}}>No hay datos de pólizas por mes.</p>
          )}
        </div>

        {/* Gráfico: Pólizas por Compañía */}
        <div className="chart-card">
          <h3 className="chart-header">Distribución por Compañía</h3>
          {porCompania.length > 0 ? (
            <div className="mock-bar-list">
              {porCompania.map((item, index) => {
                const maxVal = Math.max(...porCompania.map(i => i.cantidad || 0), 1);
                const width = `${((item.cantidad || 0) / maxVal) * 100}%`;
                
                return (
                  <div className="mock-bar-item" key={index}>
                    <span className="mock-bar-label">{item.compania || `Compañía ${index+1}`}</span>
                    <div className="mock-bar-track">
                      <div className="mock-bar-fill" style={{ width, background: 'linear-gradient(90deg, #10b981, #34d399)' }}></div>
                    </div>
                    <span className="mock-bar-value">{item.cantidad || 0}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{color: 'var(--text-secondary)'}}>No hay datos de pólizas por compañía.</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
