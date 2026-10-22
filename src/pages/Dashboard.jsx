import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../services/dashboardService';
import { getPolizas } from '../services/polizaService';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Brush
} from 'recharts';
import { 
  Users, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  BarChart2, 
  Maximize2, 
  Minimize2, 
  Calendar 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

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

const formatYAxisTick = (v) => {
  if (v >= 1_000_000) {
    return `$${(v / 1_000_000).toFixed(1)}M`;
  }
  return `$${(v / 1_000).toFixed(0)}k`;
};

const MESES_3_LETRAS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const MonthlyTooltip = ({ active, payload, metric = 'premio' }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPremio = metric === 'premio';
    return (
      <div className="bg-card text-foreground border border-border rounded-lg p-3 text-xs shadow-lg min-w-[170px]">
        <p className="font-semibold text-foreground mb-2 pb-1.5 border-b border-border/60">{data.mes}</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-4">
            <span className={`flex items-center gap-1.5 ${isPremio ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
              <span className={`h-2 w-2 rounded-full shrink-0 ${isPremio ? 'bg-primary ring-2 ring-primary/20' : 'bg-primary'}`} />
              Premios:
            </span>
            <span className={`tabular-nums ${isPremio ? 'text-primary font-bold' : 'text-foreground font-semibold'}`}>
              {formatCurrency(data.premio ?? data.prima)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <span className={`flex items-center gap-1.5 ${!isPremio ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
              <span className={`h-2 w-2 rounded-full shrink-0 ${!isPremio ? 'bg-sky-400 ring-2 ring-sky-400/20' : 'bg-slate-400'}`} />
              Pólizas:
            </span>
            <span className={`tabular-nums ${!isPremio ? 'text-sky-400 font-bold' : 'text-foreground font-semibold'}`}>
              {formatNumber(data.cantidad)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('timeline');
  const [chartType, setChartType] = useState('line');
  const [dateMode, setDateMode] = useState('emision'); // 'emision' | 'vigencia'
  const [metric, setMetric] = useState('premio'); // 'premio' | 'cantidad'
  const [rangeFilter, setRangeFilter] = useState('all'); // '12m' | '2026' | '3y' | 'all'
  const [isChartExpanded, setIsChartExpanded] = useState(false);

  // React Query: Carga optimizada y cacheada de estadísticas generales
  const { 
    data: stats, 
    isLoading: isLoadingStats, 
    isError: isErrorStats 
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  // React Query: Pólizas para cálculo de vencimientos próximos y evolución temporal
  const { 
    data: polizasData, 
    isLoading: isLoadingPolizas, 
    isError: isErrorPolizas 
  } = useQuery({
    queryKey: ['polizas', 'dashboard'],
    queryFn: () => getPolizas({ size: 500 }),
  });

  const polizas = useMemo(() => {
    if (Array.isArray(polizasData?.content)) return polizasData.content;
    if (Array.isArray(polizasData)) return polizasData;
    return [];
  }, [polizasData]);

  const loading = isLoadingStats || isLoadingPolizas;
  const error = (isErrorStats || isErrorPolizas) 
    ? "No se pudieron cargar las estadísticas. Verifica tu conexión al servidor." 
    : null;

  const totalClientes = stats?.cantClientesActivos || 0;
  const premios = stats?.totalPremios ?? stats?.totalPrimas ?? 0;
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

  // Construcción de la línea de tiempo completa
  const fullTimelineData = useMemo(() => {
    // Caso 1: Modo emisión y stats.polizasPorMes disponible desde el backend
    if (dateMode === 'emision' && Array.isArray(stats?.polizasPorMes) && stats.polizasPorMes.length > 0) {
      const rawMap = {};
      let minDate = null;
      let maxDate = null;

      stats.polizasPorMes.forEach((item) => {
        const anio = Number(item.anio);
        const mes = Number(item.mes);
        if (anio && mes && mes >= 1 && mes <= 12) {
          const key = `${anio}-${String(mes).padStart(2, '0')}`;
          const premio = Number(item.totalPremio ?? 0);
          const cantidad = Number(item.cantidad ?? 0);
          rawMap[key] = { premio, prima: premio, cantidad, anio, mes };

          const d = new Date(anio, mes - 1, 1);
          if (!minDate || d < minDate) minDate = d;
          if (!maxDate || d > maxDate) maxDate = d;
        }
      });

      if (!minDate || !maxDate) return [];

      const result = [];
      const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

      while (cursor <= end) {
        const year = cursor.getFullYear();
        const month = cursor.getMonth();
        const key = `${year}-${String(month + 1).padStart(2, '0')}`;
        const mesLabel = `${MESES_3_LETRAS[month]} ${String(year).slice(-2)}`;
        const data = rawMap[key] || { premio: 0, prima: 0, cantidad: 0, anio: year, mes: month + 1 };

        result.push({
          key,
          mes: mesLabel,
          anio: year,
          mesNum: month + 1,
          timestamp: cursor.getTime(),
          premio: data.premio,
          prima: data.prima,
          cantidad: data.cantidad
        });

        cursor.setMonth(cursor.getMonth() + 1);
      }
      return result;
    }

    // Caso 2: Fallback agrupando polizas locales (o modo 'vigencia')
    const validPolizas = polizas.filter((p) => {
      const dateStr = dateMode === 'emision' 
        ? (p.fechaEmision || p.inicioVigencia) 
        : p.inicioVigencia;
      return dateStr && !isNaN(new Date(dateStr + 'T00:00:00').getTime());
    });

    if (validPolizas.length === 0) return [];

    const rawMonthlyMap = {};
    let minDate = null;
    let maxDate = null;

    validPolizas.forEach((p) => {
      const dateStr = dateMode === 'emision' 
        ? (p.fechaEmision || p.inicioVigencia) 
        : p.inicioVigencia;
      const d = new Date(dateStr + 'T00:00:00');
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;

      if (!rawMonthlyMap[key]) {
        rawMonthlyMap[key] = { premio: 0, prima: 0, cantidad: 0, anio: year, mes: month + 1 };
      }
      const monto = Number(p.premio ?? p.prima ?? 0);
      rawMonthlyMap[key].premio += monto;
      rawMonthlyMap[key].prima += monto;
      rawMonthlyMap[key].cantidad += 1;

      const monthStart = new Date(year, month, 1);
      if (!minDate || monthStart < minDate) minDate = monthStart;
      if (!maxDate || monthStart > maxDate) maxDate = monthStart;
    });

    if (!minDate || !maxDate) return [];

    const result = [];
    const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const end = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

    while (cursor <= end) {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      const key = `${year}-${String(month + 1).padStart(2, '0')}`;
      const mesLabel = `${MESES_3_LETRAS[month]} ${String(year).slice(-2)}`;
      const data = rawMonthlyMap[key] || { premio: 0, prima: 0, cantidad: 0, anio: year, mes: month + 1 };

      result.push({
        key,
        mes: mesLabel,
        anio: year,
        mesNum: month + 1,
        timestamp: cursor.getTime(),
        premio: data.premio,
        prima: data.prima,
        cantidad: data.cantidad
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }
    return result;
  }, [dateMode, stats, polizas]);

  // Aplicación del filtro de rango rápido
  const monthlyTimelineData = useMemo(() => {
    if (fullTimelineData.length === 0) return [];
    if (rangeFilter === 'all') return fullTimelineData;
    if (rangeFilter === '2026') {
      const res = fullTimelineData.filter((item) => item.anio === 2026);
      return res.length > 0 ? res : fullTimelineData;
    }
    if (rangeFilter === '12m') {
      return fullTimelineData.length > 12 ? fullTimelineData.slice(-12) : fullTimelineData;
    }
    if (rangeFilter === '3y') {
      return fullTimelineData.length > 36 ? fullTimelineData.slice(-36) : fullTimelineData;
    }
    return fullTimelineData;
  }, [fullTimelineData, rangeFilter]);

  const PALETTE_RAMOS = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4',
    '#f97316', '#6366f1', '#14b8a6', '#a855f7', '#e11d48', '#84cc16',
    '#64748b', '#0ea5e9', '#d946ef', '#22c55e'
  ];

  // Distribución por Ramo: Prioriza precalculado del backend; fallback a agregación local
  const pieRamos = useMemo(() => {
    if (stats?.polizasPorRamo && stats.polizasPorRamo.length > 0) {
      return stats.polizasPorRamo.map(item => ({ 
        name: item.nombre || 'Otro', 
        value: Number(item.cantidad || 0) 
      }));
    }
    const ramosData = polizas.reduce((acc, p) => {
      const ramo = p.nombreRamo || 'Otro';
      acc[ramo] = (acc[ramo] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(ramosData).map(key => ({ name: key, value: ramosData[key] }));
  }, [stats, polizas]);

  // Distribución por Medio de Pago: Prioriza precalculado del backend; fallback a agregación local
  const piePagos = useMemo(() => {
    if (stats?.polizasPorTipoPago && stats.polizasPorTipoPago.length > 0) {
      return stats.polizasPorTipoPago.map(item => ({ 
        name: typeof item.tipoPago === 'string' ? item.tipoPago.replace(/_/g, ' ') : (item.tipoPago || 'Otro'), 
        value: Number(item.cantidad || 0) 
      }));
    }
    const pagosData = polizas.reduce((acc, p) => {
      const pago = p.tipoPago ? String(p.tipoPago).replace(/_/g, ' ') : 'Otro';
      acc[pago] = (acc[pago] || 0) + 1;
      return acc;
    }, {});
    return Object.keys(pagosData).map(key => ({ name: key, value: pagosData[key] }));
  }, [stats, polizas]);

  const renderTimelineChart = (containerHeight = "h-[340px]") => {
    if (monthlyTimelineData.length === 0) {
      return (
        <div className={`flex ${containerHeight} items-center justify-center text-muted-foreground text-sm`}>
          No hay datos de emisiones mensuales para los criterios seleccionados.
        </div>
      );
    }

    const isPremio = metric === 'premio';
    const dataKey = isPremio ? 'premio' : 'cantidad';
    const dataName = isPremio ? 'Premios' : 'Pólizas';
    const yAxisFormatter = isPremio
      ? formatYAxisTick
      : (v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v);

    return (
      <div className={`w-full ${containerHeight}`}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'line' ? (
            <AreaChart data={monthlyTimelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="lineAnchorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis 
                dataKey="mes" 
                className="text-muted-foreground" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                tick={{ fill: 'currentColor' }} 
              />
              <YAxis 
                className="text-muted-foreground" 
                fontSize={11} 
                allowDecimals={false}
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                tickFormatter={yAxisFormatter} 
                tick={{ fill: 'currentColor' }} 
              />
              <Tooltip content={<MonthlyTooltip metric={metric} />} />
              <Area
                type="monotone"
                dataKey={dataKey}
                name={dataName}
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#lineAnchorGradient)"
                fillOpacity={1}
                dot={{ r: 3, fill: '#3b82f6', stroke: 'hsl(var(--card))', strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: '#3b82f6', stroke: 'hsl(var(--card))', strokeWidth: 2 }}
              />
              <Brush 
                dataKey="mes" 
                height={26} 
                stroke="#3b82f6" 
                fill="hsl(var(--card))" 
                travellerWidth={10} 
              />
            </AreaChart>
          ) : (
            <BarChart data={monthlyTimelineData} margin={{ top: 15, right: 15, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis 
                dataKey="mes" 
                className="text-muted-foreground" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                tick={{ fill: 'currentColor' }} 
              />
              <YAxis 
                className="text-muted-foreground" 
                fontSize={11} 
                allowDecimals={false}
                tickLine={false} 
                axisLine={false} 
                tickMargin={8} 
                tickFormatter={yAxisFormatter} 
                tick={{ fill: 'currentColor' }} 
              />
              <Tooltip content={<MonthlyTooltip metric={metric} />} cursor={{ className: 'fill-muted/40' }} />
              <Bar dataKey={dataKey} name={dataName} fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Brush 
                dataKey="mes" 
                height={26} 
                stroke="#3b82f6" 
                fill="hsl(var(--card))" 
                travellerWidth={10} 
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  const timelineControls = (
    <div className="flex items-center flex-wrap gap-2">
      <Select value={dateMode} onValueChange={setDateMode}>
        <SelectTrigger className="h-8 text-xs w-[185px] bg-background/80">
          <Calendar className="mr-1.5 h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <SelectValue placeholder="Criterio temporal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="emision">Suscripción/Emisión</SelectItem>
          <SelectItem value="vigencia">Inicio de Vigencia</SelectItem>
        </SelectContent>
      </Select>

      <div className="inline-flex p-1 bg-background/80 border border-border rounded-lg gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setMetric('premio')}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer transition-all duration-150 active:scale-95 ${
            metric === 'premio'
              ? 'bg-card text-foreground shadow-xs border border-border font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
          }`}
          title="Ver gráfico por total de premios ($)"
        >
          <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
          <span>Premios ($)</span>
        </button>
        <button
          type="button"
          onClick={() => setMetric('cantidad')}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer transition-all duration-150 active:scale-95 ${
            metric === 'cantidad'
              ? 'bg-card text-foreground shadow-xs border border-border font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
          }`}
          title="Ver gráfico por cantidad de pólizas emitidas"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          <span>Cantidad</span>
        </button>
      </div>

      <div className="inline-flex p-0.5 bg-background/80 border border-border rounded-lg gap-0.5">
        {[
          { id: '12m', label: 'Últimos 12 meses' },
          { id: '2026', label: 'Año 2026' },
          { id: '3y', label: 'Últimos 3 años' },
          { id: 'all', label: 'Todo el historial' },
        ].map((btn) => (
          <button
            key={btn.id}
            type="button"
            onClick={() => setRangeFilter(btn.id)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer transition-all duration-150 ${
              rangeFilter === btn.id
                ? 'bg-card text-foreground shadow-xs border border-border font-semibold'
                : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="inline-flex p-1 bg-background/80 border border-border rounded-lg gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setChartType('line')}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer transition-all duration-150 active:scale-95 ${
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
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer transition-all duration-150 active:scale-95 ${
            chartType === 'bar'
              ? 'bg-card text-foreground shadow-xs border border-border font-semibold'
              : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
          }`}
        >
          <BarChart2 className="h-3.5 w-3.5" />
          <span>Barras</span>
        </button>
      </div>
    </div>
  );

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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Dashboard</h1>
        <span className="text-muted-foreground/40 hidden sm:inline">-</span>
        <p className="text-sm text-muted-foreground">Resumen general y métricas principales de SegurAPI.</p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/20 p-3.5 rounded-md text-sm">
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
        
        {/* Premios Acumulados */}
        <Card className="group bg-card border border-border rounded-lg p-5 flex flex-col justify-between shadow-xs hover:-translate-y-0.5 hover:shadow-md hover:border-slate-600/60 hover:bg-card-hover transition-all duration-200 ease-out min-h-[132px]">
          <CardHeader className="p-0 flex flex-row items-center justify-between text-muted-foreground space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Premios Acumulados</CardTitle>
            <DollarSign className="h-5 w-5 text-emerald-400 group-hover:scale-105 transition-transform duration-200 shrink-0" />
          </CardHeader>
          <CardContent className="p-0 mt-4">
            <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight tabular-nums">{formatCurrency(premios)}</div>
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-semibold text-foreground tracking-tight">
                {activeTab === 'timeline' && 'Emisión de Pólizas'}
                {activeTab === 'companies' && 'Distribución por Compañía'}
                {activeTab === 'distribution' && 'Composición de Cartera'}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {activeTab === 'timeline' && (metric === 'premio' ? 'Evolución mensual de premios emitidos por período' : 'Evolución mensual de cantidad de pólizas emitidas por período')}
                {activeTab === 'companies' && 'Volumen de pólizas agrupadas por aseguradora'}
                {activeTab === 'distribution' && 'Desglose proporcional por ramo y método de cobro'}
              </p>
            </div>

            {activeTab === 'timeline' && (
              <div className="flex items-center flex-wrap gap-2">
                {timelineControls}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChartExpanded(true)}
                  className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0 border-border"
                  title="Expandir a pantalla completa"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline ml-1.5">Expandir</span>
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          
          {activeTab === 'timeline' && renderTimelineChart("h-[340px]")}

          {activeTab === 'companies' && (
            <div className="w-full h-[320px]">
              {porCompania.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porCompania} margin={{ top: 15, right: 15, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="nombre" className="text-muted-foreground" fontSize={11} tickLine={false} axisLine={false} tick={{ fill: 'currentColor' }} />
                    <YAxis className="text-muted-foreground" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: 'currentColor' }} />
                    <Tooltip 
                      cursor={{ className: 'fill-muted/40' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))', fontSize: '12px' }}
                      itemStyle={{ color: '#3b82f6', fontWeight: '500' }}
                    />
                    <Bar dataKey="cantidad" name="Pólizas" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-sm">No hay datos de pólizas por compañía.</div>
              )}
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="grid md:grid-cols-2 gap-8 h-auto min-h-[380px]">
              {/* Composición por Ramo */}
              <div className="flex flex-col items-center bg-card/40 p-4 rounded-xl border border-border/60 shadow-xs">
                <div className="w-full flex items-center justify-between mb-3 px-1">
                  <h4 className="text-xs font-semibold text-foreground tracking-wide">Composición por Ramo</h4>
                  <span className="text-xs text-muted-foreground font-medium">
                    {pieRamos.reduce((acc, r) => acc + r.value, 0)} pólizas
                  </span>
                </div>

                {pieRamos.length > 0 ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full h-[210px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={pieRamos} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={50} 
                            outerRadius={75} 
                            paddingAngle={3} 
                            dataKey="value"
                          >
                            {pieRamos.map((entry, index) => (
                              <Cell 
                                key={`cell-ramo-${index}`} 
                                fill={PALETTE_RAMOS[index % PALETTE_RAMOS.length]} 
                                stroke="hsl(var(--card))" 
                                strokeWidth={2} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [`${value} póliza${value !== 1 ? 's' : ''}`, name]}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              borderColor: 'hsl(var(--border))', 
                              borderRadius: '8px', 
                              color: 'hsl(var(--foreground))', 
                              fontSize: '12px' 
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Leyenda con scroll dedicada que nunca corta la torta */}
                    <div className="w-full max-h-[160px] overflow-y-auto mt-2 pr-1 space-y-1.5 border-t border-border/40 pt-2.5">
                      {pieRamos.map((entry, index) => {
                        const total = pieRamos.reduce((sum, r) => sum + r.value, 0);
                        const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
                        return (
                          <div 
                            key={`ramo-${entry.name}`} 
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-center gap-2 truncate max-w-[65%]">
                              <span 
                                className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs" 
                                style={{ backgroundColor: PALETTE_RAMOS[index % PALETTE_RAMOS.length] }} 
                              />
                              <span className="text-muted-foreground truncate font-medium" title={entry.name}>
                                {entry.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-semibold text-foreground tabular-nums">
                                {entry.value}
                              </span>
                              <span className="text-[10px] text-muted-foreground tabular-nums font-mono bg-muted/80 px-1.5 py-0.5 rounded">
                                {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground text-xs">
                    No hay datos por ramo.
                  </div>
                )}
              </div>

              {/* Medios de Pago */}
              <div className="flex flex-col items-center bg-card/40 p-4 rounded-xl border border-border/60 shadow-xs">
                <div className="w-full flex items-center justify-between mb-3 px-1">
                  <h4 className="text-xs font-semibold text-foreground tracking-wide">Medios de Pago</h4>
                  <span className="text-xs text-muted-foreground font-medium">
                    {piePagos.reduce((acc, p) => acc + p.value, 0)} operaciones
                  </span>
                </div>

                {piePagos.length > 0 ? (
                  <div className="w-full flex flex-col items-center">
                    <div className="w-full h-[210px] relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={piePagos} 
                            cx="50%" 
                            cy="50%" 
                            innerRadius={50} 
                            outerRadius={75} 
                            paddingAngle={3} 
                            dataKey="value"
                          >
                            {piePagos.map((entry, index) => (
                              <Cell 
                                key={`cell-pago-${index}`} 
                                fill={PALETTE_RAMOS[(index + 4) % PALETTE_RAMOS.length]} 
                                stroke="hsl(var(--card))" 
                                strokeWidth={2} 
                              />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value, name) => [`${value} operación${value !== 1 ? 'es' : ''}`, name]}
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              borderColor: 'hsl(var(--border))', 
                              borderRadius: '8px', 
                              color: 'hsl(var(--foreground))', 
                              fontSize: '12px' 
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Leyenda con scroll dedicada */}
                    <div className="w-full max-h-[160px] overflow-y-auto mt-2 pr-1 space-y-1.5 border-t border-border/40 pt-2.5">
                      {piePagos.map((entry, index) => {
                        const total = piePagos.reduce((sum, p) => sum + p.value, 0);
                        const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
                        return (
                          <div 
                            key={`pago-${entry.name}`} 
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-md hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-center gap-2 truncate max-w-[65%]">
                              <span 
                                className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs" 
                                style={{ backgroundColor: PALETTE_RAMOS[(index + 4) % PALETTE_RAMOS.length] }} 
                              />
                              <span className="text-muted-foreground truncate font-medium" title={entry.name}>
                                {entry.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-semibold text-foreground tabular-nums">
                                {entry.value}
                              </span>
                              <span className="text-[10px] text-muted-foreground tabular-nums font-mono bg-muted/80 px-1.5 py-0.5 rounded">
                                {pct}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex h-[280px] items-center justify-center text-muted-foreground text-xs">
                    No hay datos de pagos.
                  </div>
                )}
              </div>
            </div>
          )}
          
        </CardContent>
      </Card>

      {/* Modal Dialog Expandido para Gráfico a Pantalla Completa */}
      <Dialog open={isChartExpanded} onOpenChange={setIsChartExpanded}>
        <DialogContent className="sm:max-w-[95vw] w-[95vw] h-[85vh] max-h-[85vh] flex flex-col p-6 overflow-hidden bg-card border-border">
          <DialogHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div>
              <DialogTitle className="text-lg font-bold">Evolución Histórica de Pólizas y Premios</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Curva histórica mensual con zoom interactivo y filtrado por fecha
              </DialogDescription>
            </div>

            <div className="flex items-center gap-2">
              {timelineControls}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsChartExpanded(false)}
                className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground shrink-0 border-border"
                title="Minimizar"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline ml-1.5">Minimizar</span>
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 w-full min-h-0 pt-4 h-[550px]">
            {renderTimelineChart("h-[550px]")}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
