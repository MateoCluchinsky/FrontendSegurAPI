import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/dashboardService';
import { getPolizas } from '../services/polizaService';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Users, DollarSign, ShieldCheck, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

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

const MESES_3_LETRAS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const MonthlyTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-zinc-900 text-zinc-100 border border-zinc-800 rounded-md p-2.5 text-xs shadow-none">
        <p className="font-medium text-zinc-200 mb-1">{data.mes}</p>
        <p className="text-zinc-400">Primas: <span className="text-zinc-100 font-medium tabular-nums">{formatCurrency(data.prima)}</span></p>
        <p className="text-zinc-400">Pólizas: <span className="text-zinc-100 font-medium tabular-nums">{formatNumber(data.cantidad)}</span></p>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [polizas, setPolizas] = useState([]);
  const [activeTab, setActiveTab] = useState('timeline');
  const [chartType, setChartType] = useState('line');
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
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <div className="h-7 w-36 bg-zinc-800 animate-pulse rounded-md"></div>
          <div className="h-4 w-72 bg-zinc-800/60 animate-pulse rounded-md mt-1"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-zinc-900 border border-zinc-800 rounded-md p-4 flex flex-col justify-between animate-pulse shadow-none">
              <div className="h-3.5 w-1/2 bg-zinc-800 rounded-md mb-3"></div>
              <div className="h-7 w-3/4 bg-zinc-800 rounded-md"></div>
            </Card>
          ))}
        </div>
        <div className="inline-flex p-1 bg-zinc-900 border border-zinc-800 rounded-md gap-1 mb-4 h-9 w-72 animate-pulse"></div>
        <Card className="bg-zinc-900 border border-zinc-800 rounded-md p-5 animate-pulse h-[360px] shadow-none"></Card>
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
    const fechaFin = new Date(p.finVigencia + 'T00:00:00');
    return fechaFin >= today && fechaFin <= next30Days;
  }).length;

  // Agrupado mensual continuo para el gráfico de emisiones
  const validPolizas = polizas.filter(p => p.inicioVigencia && !isNaN(new Date(p.inicioVigencia + 'T00:00:00').getTime()));
  
  let monthlyTimelineData = [];
  if (validPolizas.length > 0) {
    const rawMonthlyMap = {};
    let minDate = null;
    let maxDate = null;

    validPolizas.forEach(p => {
      const d = new Date(p.inicioVigencia + 'T00:00:00');
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      
      if (!rawMonthlyMap[key]) {
        rawMonthlyMap[key] = { prima: 0, cantidad: 0 };
      }
      rawMonthlyMap[key].prima += (p.prima || 0);
      rawMonthlyMap[key].cantidad += 1;

      const monthStart = new Date(year, month, 1);
      if (!minDate || monthStart < minDate) minDate = monthStart;
      if (!maxDate || monthStart > maxDate) maxDate = monthStart;
    });

    const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    while (cursor <= end) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const mesLabel = `${MESES_3_LETRAS[month]} ${String(year).slice(-2)}`;
      const data = rawMonthlyMap[key] || { prima: 0, cantidad: 0 };

      monthlyTimelineData.push({
        key,
        mes: mesLabel,
        timestamp: cursor.getTime(),
        prima: data.prima,
        cantidad: data.cantidad
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

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

  // Paleta sobria basada en el acento azul y tonos neutros zinc
  const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#71717a', '#52525b'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="text-sm text-zinc-400">Resumen general y métricas principales de SegurAPI.</p>
      </div>

      {error && (
        <div className="bg-red-950/20 text-red-400 border border-red-900/50 p-3.5 rounded-md text-sm">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total de Clientes */}
        <Card className="bg-zinc-900 border border-zinc-800 rounded-md p-4 flex flex-col justify-between shadow-none hover:border-zinc-700 transition-colors">
          <CardHeader className="p-0 flex flex-row items-center justify-between text-zinc-400 text-xs font-medium space-y-0">
            <CardTitle className="text-xs font-medium text-zinc-400">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent className="p-0 mt-3">
            <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">{formatNumber(totalClientes)}</div>
          </CardContent>
        </Card>
        
        {/* Primas Acumuladas */}
        <Card className="bg-zinc-900 border border-zinc-800 rounded-md p-4 flex flex-col justify-between shadow-none hover:border-zinc-700 transition-colors">
          <CardHeader className="p-0 flex flex-row items-center justify-between text-zinc-400 text-xs font-medium space-y-0">
            <CardTitle className="text-xs font-medium text-zinc-400">Primas Acumuladas</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent className="p-0 mt-3">
            <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">{formatCurrency(primas)}</div>
          </CardContent>
        </Card>
        
        {/* Pólizas Activas */}
        <Card className="bg-zinc-900 border border-zinc-800 rounded-md p-4 flex flex-col justify-between shadow-none hover:border-zinc-700 transition-colors">
          <CardHeader className="p-0 flex flex-row items-center justify-between text-zinc-400 text-xs font-medium space-y-0">
            <CardTitle className="text-xs font-medium text-zinc-400">Pólizas Activas</CardTitle>
            <ShieldCheck className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent className="p-0 mt-3">
            <div className="text-2xl font-semibold text-white tracking-tight tabular-nums">{formatNumber(polizasActivas)}</div>
          </CardContent>
        </Card>
        
        {/* Próximos Vencimientos */}
        <Card className="bg-zinc-900 border border-zinc-800 rounded-md p-4 flex flex-col justify-between shadow-none hover:border-zinc-700 transition-colors">
          <CardHeader className="p-0 flex flex-row items-center justify-between text-zinc-400 text-xs font-medium space-y-0">
            <CardTitle className="text-xs font-medium text-zinc-400">Próximos Vencimientos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent className="p-0 mt-3">
            <div className="text-2xl font-semibold text-red-400 tracking-tight tabular-nums">{formatNumber(proximosVencimientos)}</div>
            <p className="text-xs text-zinc-500 mt-1">En los próximos 30 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="inline-flex p-1 bg-zinc-900 border border-zinc-800 rounded-md gap-1 mb-4">
        {[
          { id: 'timeline', label: 'Emisión de Pólizas' },
          { id: 'companies', label: 'Compañías' },
          { id: 'distribution', label: 'Distribución' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={
              activeTab === tab.id 
                ? 'bg-zinc-800 text-white font-medium px-3.5 py-1.5 rounded-md text-xs transition-colors'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 px-3.5 py-1.5 rounded-md text-xs transition-colors'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <Card className="bg-zinc-900 border border-zinc-800 rounded-md p-5 shadow-none">
        <CardHeader className="p-0 mb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-zinc-200">
              {activeTab === 'timeline' && 'Emisión de Pólizas'}
              {activeTab === 'companies' && 'Distribución por Compañía'}
              {activeTab === 'distribution' && 'Composición de Cartera'}
            </CardTitle>

            {activeTab === 'timeline' && (
              <div className="inline-flex p-0.5 bg-zinc-950 border border-zinc-800 rounded-md gap-0.5">
                <button
                  type="button"
                  onClick={() => setChartType('line')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    chartType === 'line'
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  Línea
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
                    chartType === 'bar'
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  Barras
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          
          {activeTab === 'timeline' && (
            <div className="w-full h-[320px]">
              {monthlyTimelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <LineChart data={monthlyTimelineData} margin={{ top: 15, right: 15, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="mes" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} className="tabular-nums" />
                      <Tooltip content={<MonthlyTooltip />} />
                      <Line
                        type="linear"
                        dataKey="prima"
                        name="Primas"
                        stroke="#3b82f6"
                        strokeWidth={1.5}
                        dot={{ r: 3, fill: '#3b82f6', stroke: '#18181b', strokeWidth: 1.5 }}
                        activeDot={{ r: 5, fill: '#3b82f6', stroke: '#18181b', strokeWidth: 2 }}
                      />
                    </LineChart>
                  ) : (
                    <BarChart data={monthlyTimelineData} margin={{ top: 15, right: 15, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                      <XAxis dataKey="mes" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} className="tabular-nums" />
                      <Tooltip content={<MonthlyTooltip />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
                      <Bar dataKey="prima" name="Primas" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-500 text-sm">No hay datos de emisiones mensuales.</div>
              )}
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="w-full h-[320px]">
              {porCompania.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porCompania} margin={{ top: 15, right: 15, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="nombre" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} className="tabular-nums" />
                    <Tooltip 
                      cursor={{ fill: '#27272a', opacity: 0.4 }}
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '6px', color: '#f4f4f5', fontSize: '12px' }}
                      itemStyle={{ color: '#3b82f6', fontWeight: '500' }}
                    />
                    <Bar dataKey="cantidad" name="Pólizas" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-zinc-500 text-sm">No hay datos de pólizas por compañía.</div>
              )}
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="grid md:grid-cols-2 gap-8 h-auto md:h-[320px]">
              <div className="flex flex-col items-center">
                <h4 className="text-xs font-medium text-zinc-400 mb-4">Composición por Ramo</h4>
                {pieRamos.length > 0 ? (
                  <div className="w-full h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieRamos} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                          {pieRamos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#18181b" strokeWidth={1} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '6px', color: '#f4f4f5', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[240px] items-center justify-center text-zinc-500 text-xs">No hay datos por ramo.</div>
                )}
              </div>

              <div className="flex flex-col items-center">
                <h4 className="text-xs font-medium text-zinc-400 mb-4">Medios de Pago</h4>
                {piePagos.length > 0 ? (
                  <div className="w-full h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={piePagos} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                          {piePagos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} stroke="#18181b" strokeWidth={1} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '6px', color: '#f4f4f5', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[240px] items-center justify-center text-zinc-500 text-xs">No hay datos de pagos.</div>
                )}
              </div>
            </div>
          )}
          
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
