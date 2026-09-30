import { useState, useEffect } from 'react';
import { getDashboardStats } from '../services/dashboardService';
import { getPolizas } from '../services/polizaService';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Users, DollarSign, ShieldCheck, AlertTriangle, TrendingUp, BarChart2 } from 'lucide-react';
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
      <div className="bg-card text-foreground border border-border rounded-lg p-3 text-xs shadow-lg min-w-[170px]">
        <p className="font-semibold text-foreground mb-2 pb-1.5 border-b border-border/60">{data.mes}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              Primas:
            </span>
            <span className="text-foreground font-semibold tabular-nums">{formatCurrency(data.prima)}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
              Pólizas:
            </span>
            <span className="text-foreground font-semibold tabular-nums">{formatNumber(data.cantidad)}</span>
          </div>
        </div>
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
        <div className="flex items-center gap-3">
          <div className="h-7 w-36 bg-muted/60 animate-pulse rounded-md"></div>
          <div className="h-4 w-72 bg-muted/40 animate-pulse rounded-md"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-card border border-border rounded-lg p-5 flex flex-col justify-between animate-pulse shadow-xs min-h-[132px]">
              <div className="flex items-center justify-between">
                <div className="h-3 w-24 bg-muted/60 rounded"></div>
                <div className="h-4 w-4 bg-muted/50 rounded"></div>
              </div>
              <div className="h-8 w-28 bg-muted/70 rounded mt-4"></div>
            </Card>
          ))}
        </div>
        <div className="inline-flex p-1 bg-card border border-border/80 rounded-lg gap-1 mb-4 h-10 w-72 animate-pulse shadow-xs"></div>
        <Card className="bg-card border border-border rounded-xl p-5 animate-pulse h-[360px] shadow-xs"></Card>
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

  // Paleta sobria basada en el acento azul y tonos neutros
  const COLORS = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#64748b', '#475569'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <span className="text-muted-foreground/40 hidden sm:inline">-</span>
        <p className="text-sm text-muted-foreground">Resumen general y métricas principales de SegurAPI.</p>
      </div>

      {error && (
        <div className="bg-red-950/20 text-red-400 border border-red-900/50 p-3.5 rounded-md text-sm">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total de Clientes */}
        <Card className="group bg-card border border-border rounded-lg p-5 flex flex-col justify-between shadow-xs hover:-translate-y-0.5 hover:shadow-md hover:border-slate-600/60 hover:bg-card-hover transition-all duration-200 ease-out min-h-[132px]">
          <CardHeader className="p-0 flex flex-row items-center justify-between text-muted-foreground space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total de Clientes</CardTitle>
            <Users className="h-5 w-5 text-sky-400 group-hover:scale-105 transition-transform duration-200 shrink-0" />
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-3xl font-bold text-foreground tracking-tight tabular-nums">{formatNumber(totalClientes)}</div>
          </CardContent>
        </Card>
        
        {/* Primas Acumuladas */}
        <Card className="group bg-card border border-border rounded-lg p-5 flex flex-col justify-between shadow-xs hover:-translate-y-0.5 hover:shadow-md hover:border-slate-600/60 hover:bg-card-hover transition-all duration-200 ease-out min-h-[132px]">
          <CardHeader className="p-0 flex flex-row items-center justify-between text-muted-foreground space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Primas Acumuladas</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-400 group-hover:scale-105 transition-transform duration-200 shrink-0" />
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">{formatCurrency(primas)}</div>
          </CardContent>
        </Card>
        
        {/* Pólizas Activas */}
        <Card className="group bg-card border border-border rounded-lg p-5 flex flex-col justify-between shadow-xs hover:-translate-y-0.5 hover:shadow-md hover:border-slate-600/60 hover:bg-card-hover transition-all duration-200 ease-out min-h-[132px]">
          <CardHeader className="p-0 flex flex-row items-center justify-between text-muted-foreground space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pólizas Activas</CardTitle>
            <ShieldCheck className="h-5 w-5 text-blue-400 group-hover:scale-105 transition-transform duration-200 shrink-0" />
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-3xl font-bold text-foreground tracking-tight tabular-nums">{formatNumber(polizasActivas)}</div>
          </CardContent>
        </Card>
        
        {/* Próximos Vencimientos */}
        <Card className="group bg-card border border-border rounded-lg p-5 flex flex-col justify-between shadow-xs hover:-translate-y-0.5 hover:shadow-md hover:border-slate-600/60 hover:bg-card-hover transition-all duration-200 ease-out min-h-[132px]">
          <CardHeader className="p-0 flex flex-row items-center justify-between text-muted-foreground space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Próximos Vencimientos</CardTitle>
            <AlertTriangle className="h-5 w-5 text-amber-400 group-hover:scale-105 transition-transform duration-200 shrink-0" />
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className={`text-3xl font-bold tracking-tight tabular-nums ${proximosVencimientos > 0 ? 'text-rose-400' : 'text-foreground'}`}>
              {formatNumber(proximosVencimientos)}
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">En los próximos 30 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con estilo pill sutil */}
      <div className="inline-flex p-1 bg-card border border-border/80 rounded-lg gap-1 mb-4 shadow-xs">
        {[
          { id: 'timeline', label: 'Emisión de Pólizas' },
          { id: 'companies', label: 'Compañías' },
          { id: 'distribution', label: 'Distribución' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-2 text-xs font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer ${
              activeTab === tab.id 
                ? 'bg-card-hover text-foreground font-semibold shadow-xs border border-white/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-card-hover/30 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <Card className="bg-card border border-border rounded-xl p-6 shadow-xs hover:border-slate-700/60 transition-colors duration-200">
        <CardHeader className="p-0 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold text-foreground tracking-tight">
                {activeTab === 'timeline' && 'Emisión de Pólizas'}
                {activeTab === 'companies' && 'Distribución por Compañía'}
                {activeTab === 'distribution' && 'Composición de Cartera'}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab === 'timeline' && 'Evolución mensual de primas emitidas por período'}
                {activeTab === 'companies' && 'Volumen de pólizas agrupadas por aseguradora'}
                {activeTab === 'distribution' && 'Desglose proporcional por ramo y método de cobro'}
              </p>
            </div>

            {activeTab === 'timeline' && (
              <div className="inline-flex p-1 bg-background/80 border border-border rounded-lg gap-1 shrink-0 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setChartType('line')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer transition-all duration-150 active:scale-95 ${
                    chartType === 'line'
                      ? 'bg-card text-foreground shadow-xs border border-border font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Línea</span>
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer transition-all duration-150 active:scale-95 ${
                    chartType === 'bar'
                      ? 'bg-card text-foreground shadow-xs border border-border font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                  }`}
                >
                  <BarChart2 className="h-3.5 w-3.5" />
                  <span>Barras</span>
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          
          {activeTab === 'timeline' && (
            <div className="w-full h-[340px]">
              {monthlyTimelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <AreaChart data={monthlyTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="lineAnchorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1D2A40" vertical={false} />
                      <XAxis dataKey="mes" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => `$${v/1000}k`} className="tabular-nums" />
                      <Tooltip content={<MonthlyTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="prima"
                        name="Primas"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fill="url(#lineAnchorGradient)"
                        fillOpacity={1}
                        dot={{ r: 3, fill: '#3b82f6', stroke: '#0D172A', strokeWidth: 1.5 }}
                        activeDot={{ r: 5, fill: '#3b82f6', stroke: '#0D172A', strokeWidth: 2 }}
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={monthlyTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1D2A40" vertical={false} />
                      <XAxis dataKey="mes" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickMargin={10} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => `$${v/1000}k`} className="tabular-nums" />
                      <Tooltip content={<MonthlyTooltip />} cursor={{ fill: '#111D33', opacity: 0.6 }} />
                      <Bar dataKey="prima" name="Primas" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No hay datos de emisiones mensuales.</div>
              )}
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="w-full h-[320px]">
              {porCompania.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porCompania} margin={{ top: 15, right: 15, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1D2A40" vertical={false} />
                    <XAxis dataKey="nombre" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} className="tabular-nums" />
                    <Tooltip 
                      cursor={{ fill: '#111D33', opacity: 0.6 }}
                      contentStyle={{ backgroundColor: '#0D172A', borderColor: '#1D2A40', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
                      itemStyle={{ color: '#3b82f6', fontWeight: '500' }}
                    />
                    <Bar dataKey="cantidad" name="Pólizas" fill="#3b82f6" radius={[2, 2, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No hay datos de pólizas por compañía.</div>
              )}
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="grid md:grid-cols-2 gap-8 h-auto md:h-[320px]">
              <div className="flex flex-col items-center">
                <h4 className="text-xs font-medium text-muted-foreground mb-4">Composición por Ramo</h4>
                {pieRamos.length > 0 ? (
                  <div className="w-full h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieRamos} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                          {pieRamos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#0D172A" strokeWidth={1} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0D172A', borderColor: '#1D2A40', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[240px] items-center justify-center text-muted-foreground text-xs">No hay datos por ramo.</div>
                )}
              </div>

              <div className="flex flex-col items-center">
                <h4 className="text-xs font-medium text-muted-foreground mb-4">Medios de Pago</h4>
                {piePagos.length > 0 ? (
                  <div className="w-full h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={piePagos} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                          {piePagos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 1) % COLORS.length]} stroke="#0D172A" strokeWidth={1} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#0D172A', borderColor: '#1D2A40', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[240px] items-center justify-center text-muted-foreground text-xs">No hay datos de pagos.</div>
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
