import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/dashboardService';
import { getPolizas } from '../services/polizaService';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import '../styles/Dashboard.css';

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

const TimelineTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-tooltip" style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}>
        <p style={{ color: '#f8fafc', margin: '0 0 8px 0', fontWeight: 'bold', borderBottom: '1px solid #334155', paddingBottom: '4px' }}>{label}</p>
        <p style={{ color: '#94a3b8', margin: '0 0 4px 0', fontSize: '13px' }}>Cliente: <span style={{ color: '#f8fafc', fontWeight: '500' }}>{data.cliente}</span></p>
        <p style={{ color: '#94a3b8', margin: '0 0 4px 0', fontSize: '13px' }}>Ramo: <span style={{ color: '#60a5fa', fontWeight: '500' }}>{data.ramo}</span></p>
        <p style={{ color: '#94a3b8', margin: '0', fontSize: '13px' }}>Prima: <span style={{ color: '#34d399', fontWeight: '500' }}>{formatCurrency(data.prima)}</span></p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [polizas, setPolizas] = useState([]);
  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, polizasData] = await Promise.all([
          getDashboardStats(),
          getPolizas({ size: 10000 })
        ]);
        setStats(statsData);
        setPolizas(Array.isArray(polizasData?.content) ? polizasData.content : (Array.isArray(polizasData) ? polizasData : []));
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("No se pudieron cargar las estadísticas. Verifica tu conexión al servidor.");
        setStats({ totalClientes: 0, primasAcumuladas: 0, polizasPorMes: [], polizasPorCompania: [] });
        setPolizas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const totalClientes = stats?.cantClientesActivos || 0;
  const primas = stats?.totalPrimas || 0;
  const polizasActivas = stats?.cantPolizasActivas || 0;
  const porCompania = stats?.polizasPorCompania || [];

  const today = new Date();
  const next30Days = new Date();
  next30Days.setDate(today.getDate() + 30);
  
  const proximosVencimientos = polizas.filter(p => {
    if (!p.finVigencia) return false;
    const fechaFin = new Date(p.finVigencia + 'T00:00:00'); // Truncate time safely
    return fechaFin >= today && fechaFin <= next30Days;
  }).length;

  const timelineData = polizas
    .filter(p => p.inicioVigencia)
    .map(p => {
      const d = new Date(p.inicioVigencia + 'T00:00:00');
      return {
        fechaRaw: d,
        fecha: d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }),
        ramo: p.nombreRamo || 'Desconocido',
        cliente: p.nombreCliente || 'Desconocido',
        prima: p.prima || 0
      };
    })
    .sort((a, b) => a.fechaRaw - b.fechaRaw);

  const ramosData = polizas.reduce((acc, p) => {
    const ramo = p.nombreRamo || 'Otro';
    acc[ramo] = (acc[ramo] || 0) + 1;
    return acc;
  }, {});
  const pieRamos = Object.keys(ramosData).map(key => ({ name: key, value: ramosData[key] }));

  const pagosData = polizas.reduce((acc, p) => {
    const pago = p.tipoPago || 'Otro';
    acc[pago] = (acc[pago] || 0) + 1;
    return acc;
  }, {});
  const piePagos = Object.keys(pagosData).map(key => ({ name: key, value: pagosData[key] }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];


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
        
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(147, 197, 253, 0.2))', color: '#60a5fa' }}>
            🛡️
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Pólizas Activas</span>
            <h3 className="kpi-value">{formatNumber(polizasActivas)}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(248, 113, 113, 0.2))', color: '#f87171' }}>
            ⚠️
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Próximos Vencimientos (30 días)</span>
            <h3 className="kpi-value">{formatNumber(proximosVencimientos)}</h3>
          </div>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
          Emisión de Pólizas
        </button>
        <button className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`} onClick={() => setActiveTab('companies')}>
          Compañías
        </button>
        <button className={`tab-btn ${activeTab === 'distribution' ? 'active' : ''}`} onClick={() => setActiveTab('distribution')}>
          Distribución de Cartera
        </button>
      </div>

      <div className="charts-container">
        
        {activeTab === 'timeline' && (
          <div className="chart-card fade-in">
            <h3 className="chart-header">Línea de Tiempo de Emisiones</h3>
            {timelineData.length > 0 ? (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis 
                      dataKey="fecha" 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickMargin={10}
                    />
                    <YAxis 
                      stroke="#94a3b8" 
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      tickFormatter={(value) => `$${value/1000}k`}
                    />
                    <Tooltip content={<TimelineTooltip />} />
                    <Line 
                      type="stepAfter" 
                      dataKey="prima" 
                      name="Prima" 
                      stroke="#60a5fa" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#1e293b', stroke: '#60a5fa', strokeWidth: 2 }} 
                      activeDot={{ r: 6, fill: '#60a5fa', stroke: '#fff', strokeWidth: 2 }} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0'}}>No hay datos de emisiones.</p>
            )}
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="chart-card fade-in">
            <h3 className="chart-header">Distribución por Compañía</h3>
            {porCompania.length > 0 ? (
              <div style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={porCompania} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="nombre" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis stroke="#94a3b8" allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)' }}
                      itemStyle={{ color: '#34d399', fontWeight: '500' }}
                    />
                    <Bar dataKey="cantidad" name="Pólizas" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {porCompania.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p style={{color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0'}}>No hay datos de pólizas por compañía.</p>
            )}
          </div>
        )}

        {activeTab === 'distribution' && (
          <div className="distribution-grid fade-in">
            <div className="chart-card">
              <h3 className="chart-header">Composición por Ramo</h3>
              {pieRamos.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={pieRamos}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieRamos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                        itemStyle={{ fontWeight: '500' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="custom-legend">
                    {pieRamos.map((entry, index) => (
                      <div key={`legend-${index}`} className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="legend-name">{entry.name}</span>
                        <span className="legend-value">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{color: 'var(--text-secondary)', textAlign: 'center'}}>No hay datos por ramo.</p>
              )}
            </div>

            <div className="chart-card">
              <h3 className="chart-header">Medios de Pago</h3>
              {piePagos.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={piePagos}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {piePagos.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} stroke="rgba(0,0,0,0)" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc' }}
                        itemStyle={{ fontWeight: '500' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="custom-legend">
                    {piePagos.map((entry, index) => (
                      <div key={`legend-${index}`} className="legend-item">
                        <span className="legend-color" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }}></span>
                        <span className="legend-name">{entry.name}</span>
                        <span className="legend-value">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p style={{color: 'var(--text-secondary)', textAlign: 'center'}}>No hay datos de pagos.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
