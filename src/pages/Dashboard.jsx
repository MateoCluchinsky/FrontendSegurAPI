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

const TimelineTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover text-popover-foreground border rounded-lg p-3 shadow-md">
        <p className="font-bold border-b border-border pb-1 mb-2">{label}</p>
        <p className="text-sm text-muted-foreground mb-1">Cliente: <span className="text-foreground font-medium">{data.cliente}</span></p>
        <p className="text-sm text-muted-foreground mb-1">Ramo: <span className="text-blue-500 font-medium">{data.ramo}</span></p>
        <p className="text-sm text-muted-foreground">Prima: <span className="text-emerald-500 font-medium">{formatCurrency(data.prima)}</span></p>
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
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <div className="h-8 w-48 bg-muted animate-pulse rounded"></div>
          <div className="h-4 w-96 bg-muted animate-pulse rounded mt-2"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2"><div className="h-4 w-1/2 bg-muted rounded"></div></CardHeader>
              <CardContent><div className="h-8 w-3/4 bg-muted rounded"></div></CardContent>
            </Card>
          ))}
        </div>
        <div className="h-10 w-full bg-muted animate-pulse rounded-xl"></div>
        <Card className="animate-pulse h-[400px]"></Card>
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
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general y métricas principales de SegurAPI.</p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 rounded-md">
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalClientes)}</div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primas Acumuladas</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(primas)}</div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pólizas Activas</CardTitle>
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(polizasActivas)}</div>
          </CardContent>
        </Card>
        
        <Card className="hover:shadow-md transition-shadow border-destructive/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Vencimientos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatNumber(proximosVencimientos)}</div>
            <p className="text-xs text-muted-foreground mt-1">En los próximos 30 días</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-xl bg-muted p-1 sm:w-fit">
        {[
          { id: 'timeline', label: 'Emisión de Pólizas' },
          { id: 'companies', label: 'Compañías' },
          { id: 'distribution', label: 'Distribución' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full sm:w-auto rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id 
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Charts */}
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'timeline' && 'Línea de Tiempo de Emisiones'}
            {activeTab === 'companies' && 'Distribución por Compañía'}
            {activeTab === 'distribution' && 'Composición de Cartera'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          
          {activeTab === 'timeline' && (
            <div className="w-full h-[350px]">
              {timelineData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="fecha" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip content={<TimelineTooltip />} />
                    <Line type="monotone" dataKey="prima" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No hay datos de emisiones.</div>
              )}
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="w-full h-[350px]">
              {porCompania.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porCompania} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="nombre" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }}
                      itemStyle={{ color: 'hsl(var(--primary))', fontWeight: '500' }}
                    />
                    <Bar dataKey="cantidad" name="Pólizas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">No hay datos de pólizas por compañía.</div>
              )}
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="grid md:grid-cols-2 gap-8 h-auto md:h-[350px]">
              <div className="flex flex-col items-center">
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Composición por Ramo</h4>
                {pieRamos.length > 0 ? (
                  <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieRamos} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                          {pieRamos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">No hay datos por ramo.</div>
                )}
              </div>

              <div className="flex flex-col items-center">
                <h4 className="text-sm font-medium text-muted-foreground mb-4">Medios de Pago</h4>
                {piePagos.length > 0 ? (
                  <div className="w-full h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={piePagos} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                          {piePagos.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} stroke="rgba(0,0,0,0)" />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--popover-foreground))' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">No hay datos de pagos.</div>
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
