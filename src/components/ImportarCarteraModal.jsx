/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getCompanias } from '../services/polizaService';
import { analizarArchivoCartera, ejecutarImportacionCartera } from '../services/importacionService';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Database,
  Building2,
  FileCheck,
  UserPlus,
  Users,
  ShieldPlus,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  X,
  Loader2,
  Search,
} from 'lucide-react';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
  }).format(value || 0);
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
};

const CAMPOS_CLAVE = [
  { id: 'nroPoliza', label: 'Nro de Póliza *' },
  { id: 'tomadorNombre', label: 'Tomador / Cliente *' },
  { id: 'documento', label: 'DNI / CUIT' },
  { id: 'inicioVigencia', label: 'Inicio Vigencia *' },
  { id: 'finVigencia', label: 'Fin Vigencia *' },
  { id: 'ramoPrincipal', label: 'Ramo *' },
  { id: 'bienAsegurado', label: 'Bien Asegurado / Riesgo' },
  { id: 'premio', label: 'Premio *' },
  { id: 'tipoPago', label: 'Tipo de Pago' },
];

const NONE_VALUE = '__NONE__';

const ImportarCarteraModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  // Pasos: 1 (Archivo), 2 (Mapeo y Preview), 3 (Resultado)
  const [step, setStep] = useState(1);

  // Paso 1 State
  const [companias, setCompanias] = useState([]);
  const [filtroCompania, setFiltroCompania] = useState('');
  const [selectedCompaniaId, setSelectedCompaniaId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Paso 2 State
  const [analysisResult, setAnalysisResult] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [ramoMappings, setRamoMappings] = useState({});
  const [showMappingAccordion, setShowMappingAccordion] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  // Paso 3 State
  const [executionResult, setExecutionResult] = useState(null);

  // Cargar y ordenar alfabéticamente compañías al abrir modal
  useEffect(() => {
    if (isOpen) {
      const fetchCompanias = async () => {
        try {
          const data = await getCompanias();
          const sorted = (data || []).slice().sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
          setCompanias(sorted);
        } catch (err) {
          console.error('Error al cargar aseguradoras', err);
        }
      };
      fetchCompanias();
    } else {
      // Reset state on close
      setStep(1);
      setSelectedCompaniaId('');
      setFiltroCompania('');
      setSelectedFile(null);
      setIsAnalyzing(false);
      setAnalysisResult(null);
      setColumnMapping({});
      setRamoMappings({});
      setShowMappingAccordion(false);
      setIsExecuting(false);
      setExecutionResult(null);
    }
  }, [isOpen]);

  // Lista de compañías filtrada en memoria
  const companiasFiltradas = useMemo(() => {
    if (!filtroCompania.trim()) return companias;
    const term = filtroCompania.toLowerCase();
    return companias.filter(c => (c.nombre || '').toLowerCase().includes(term));
  }, [companias, filtroCompania]);

  // Manejo de drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      toast.error('Formato no soportado. Por favor sube un archivo Excel (.xlsx, .xls) o CSV.');
      return;
    }
    setSelectedFile(file);
  };

  // Paso 1 -> Analizar Archivo
  const handleAnalizar = async () => {
    if (!selectedCompaniaId) {
      toast.error('Por favor selecciona la Aseguradora correspondiente a la cartera.');
      return;
    }
    if (!selectedFile) {
      toast.error('Por favor selecciona o arrastra una planilla de cartera.');
      return;
    }

    setIsAnalyzing(true);
    try {
      const data = await analizarArchivoCartera(selectedFile, selectedCompaniaId);
      setAnalysisResult(data);

      // Inicializar mapeo con lo sugerido por backend
      const initialColMap = {};
      CAMPOS_CLAVE.forEach((c) => {
        initialColMap[c.id] = data?.suggestedConfig?.columnMapping?.[c.id] || NONE_VALUE;
      });
      setColumnMapping(initialColMap);

      setRamoMappings(data?.suggestedConfig?.ramoMappings || {});
      setStep(2);
      toast.success('Cartera analizada con éxito.');
    } catch (err) {
      console.error('Error al analizar cartera', err);
      toast.error(
        err.response?.data?.message ||
          'Error al analizar la planilla. Verifica que contenga los encabezados de columnas.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Paso 2 -> Modificar Mapeo
  const handleColumnMappingChange = (campoKey, excelCol) => {
    setColumnMapping((prev) => ({
      ...prev,
      [campoKey]: excelCol,
    }));
  };

  const handleRamoMappingChange = (rawRamo, officialRamo) => {
    setRamoMappings((prev) => ({
      ...prev,
      [rawRamo]: officialRamo,
    }));
  };

  // Paso 2 -> Confirmar e Importar
  const handleEjecutar = async () => {
    // Sanitizar mapeo de columnas (remover NONE_VALUE)
    const cleanedColMap = {};
    Object.entries(columnMapping).forEach(([k, v]) => {
      if (v && v !== NONE_VALUE) {
        cleanedColMap[k] = v;
      }
    });

    const finalConfig = {
      headerRowIndex: analysisResult?.suggestedConfig?.headerRowIndex ?? 0,
      generadoPorIa: analysisResult?.suggestedConfig?.generadoPorIa || false,
      columnMapping: cleanedColMap,
      ramoMappings: ramoMappings,
    };

    setIsExecuting(true);
    try {
      const result = await ejecutarImportacionCartera(selectedFile, selectedCompaniaId, finalConfig);
      setExecutionResult(result);
      setStep(3);
      toast.success('¡Importación de cartera completada con éxito!');
      // Invalidar queries clave para que los listados y dashboards se refresquen
      queryClient.invalidateQueries({ queryKey: ['polizas'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    } catch (err) {
      console.error('Error al ejecutar importación', err);
      toast.error(
        err.response?.data?.message ||
          'Ocurrió un error al importar los registros. Revisa los mapeos de columnas.'
      );
    } finally {
      setIsExecuting(false);
    }
  };

  // Cerrar y refrescar
  const handleFinalizar = () => {
    if (step === 3) {
      queryClient.invalidateQueries({ queryKey: ['polizas'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleFinalizar}>
      <DialogContent className="sm:max-w-[950px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">Importación Inteligente de Cartera</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Carga planillas emitidas por aseguradoras (Sura, Sancor, San Cristóbal, etc.) para procesar clientes, pólizas y endosos.
              </p>
            </div>
          </div>
        </DialogHeader>

        {/* Indicador de Pasos */}
        <div className="flex items-center justify-between border-b pb-4 pt-2 text-xs">
          <div
            className={`flex items-center gap-2 font-medium ${
              step === 1 ? 'text-primary font-semibold' : step > 1 ? 'text-emerald-500' : 'text-muted-foreground'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                step === 1
                  ? 'border-primary bg-primary text-primary-foreground'
                  : step > 1
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                  : 'border-muted-foreground/30'
              }`}
            >
              {step > 1 ? <CheckCircle2 className="h-3.5 w-3.5" /> : '1'}
            </span>
            <span>1. Aseguradora y Archivo</span>
          </div>

          <div className="h-[1px] flex-1 mx-3 bg-border" />

          <div
            className={`flex items-center gap-2 font-medium ${
              step === 2 ? 'text-primary font-semibold' : step > 2 ? 'text-emerald-500' : 'text-muted-foreground'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                step === 2
                  ? 'border-primary bg-primary text-primary-foreground'
                  : step > 2
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                  : 'border-muted-foreground/30'
              }`}
            >
              {step > 2 ? <CheckCircle2 className="h-3.5 w-3.5" /> : '2'}
            </span>
            <span>2. Mapeo y Vista Previa</span>
          </div>

          <div className="h-[1px] flex-1 mx-3 bg-border" />

          <div
            className={`flex items-center gap-2 font-medium ${
              step === 3 ? 'text-emerald-500 font-semibold' : 'text-muted-foreground'
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                step === 3
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-muted-foreground/30'
              }`}
            >
              3
            </span>
            <span>3. Resultados</span>
          </div>
        </div>

        {/* PASO 1: Selección de Compañía y Archivo */}
        {step === 1 && (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="companiaSelect" className="text-sm font-semibold flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-primary" />
                  Aseguradora de Origen *
                </Label>
                {selectedCompaniaId && (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    {companias.find(c => String(c.id) === String(selectedCompaniaId))?.nombre}
                  </span>
                )}
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Buscar aseguradora (ej. Mapfre, Federación, Noble, Sancor)..."
                  value={filtroCompania}
                  onChange={(e) => setFiltroCompania(e.target.value)}
                  className="pl-9 h-9 text-xs bg-background"
                />
              </div>

              <Select value={selectedCompaniaId} onValueChange={setSelectedCompaniaId}>
                <SelectTrigger id="companiaSelect" className="w-full">
                  <SelectValue placeholder="Seleccione la aseguradora que emitió la planilla..." />
                </SelectTrigger>
                <SelectContent className="max-h-72 overflow-y-auto">
                  {companiasFiltradas.map((comp) => (
                    <SelectItem key={comp.id} value={String(comp.id)}>
                      {comp.nombre}
                    </SelectItem>
                  ))}
                  {companiasFiltradas.length === 0 && (
                    <div className="p-3 text-xs text-muted-foreground text-center">
                      No se encontraron aseguradoras que coincidan con &quot;{filtroCompania}&quot;
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Si la aseguradora ya fue importada anteriormente, SegurAPI reutilizará automáticamente la plantilla de columnas guardada.
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-primary" />
                Planilla de Cartera (Excel o CSV) *
              </Label>
              
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-primary bg-primary/10 scale-[0.99]'
                    : selectedFile
                    ? 'border-emerald-500/50 bg-emerald-500/5'
                    : 'border-muted hover:border-primary/50 hover:bg-muted/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex items-center gap-3 bg-card p-3 rounded-lg border shadow-xs max-w-md w-full text-left">
                    <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-500 shrink-0">
                      <FileCheck className="h-6 w-6" />
                    </div>
                    <div className="flex-1 truncate">
                      <p className="font-semibold text-sm truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Haz clic para seleccionar o arrastra el archivo aquí
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Formatos aceptados: .xlsx, .xls o .csv (descargados directamente del portal de la compañía)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-muted/40 border border-border/60 rounded-lg p-4 flex gap-3 text-xs text-muted-foreground">
              <Sparkles className="h-5 w-5 text-sky-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Detección y Unificación Automática</p>
                <p className="mt-0.5">
                  El motor inteligente de SegurAPI detecta filas de título/cabecera, empareja las columnas automáticamente y unifica múltiples filas del mismo número de póliza conservando siempre el endoso vigente más reciente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* PASO 2: Revisión de Mapeo y Vista Previa */}
        {step === 2 && analysisResult && (
          <div className="space-y-6 py-3">
            {/* Banner de Resumen del Análisis */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{analysisResult.companiaNombre}</span>
                  {analysisResult.plantillaEncontradaEnCache ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      <Database className="h-3 w-3" /> Plantilla Guardada
                    </span>
                  ) : analysisResult.mapeadoConIa ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <Sparkles className="h-3 w-3" /> Auto-mapeo con IA
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <CheckCircle2 className="h-3 w-3" /> Detección Heurística
                    </span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  Encabezado detectado en:{' '}
                  <strong className="text-foreground">
                    Fila {(analysisResult.suggestedConfig?.headerRowIndex ?? 0) + 1}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
                <div className="bg-muted/30 p-2.5 rounded-lg border border-border/40 text-center">
                  <span className="text-[11px] text-muted-foreground block">Filas Leídas</span>
                  <span className="text-lg font-bold text-foreground tabular-nums">
                    {analysisResult.totalRawRows}
                  </span>
                </div>
                <div className="bg-muted/30 p-2.5 rounded-lg border border-border/40 text-center">
                  <span className="text-[11px] text-muted-foreground block">Pólizas Únicas</span>
                  <span className="text-lg font-bold text-emerald-500 tabular-nums">
                    {analysisResult.totalUniquePolizas}
                  </span>
                </div>
                <div className="bg-muted/30 p-2.5 rounded-lg border border-border/40 text-center">
                  <span className="text-[11px] text-muted-foreground block">Endosos Resueltos</span>
                  <span className="text-lg font-bold text-sky-400 tabular-nums">
                    {Math.max(0, analysisResult.totalRawRows - analysisResult.totalUniquePolizas)}
                  </span>
                </div>
                <div className="bg-muted/30 p-2.5 rounded-lg border border-border/40 text-center">
                  <span className="text-[11px] text-muted-foreground block">Columnas Excel</span>
                  <span className="text-lg font-bold text-foreground tabular-nums">
                    {analysisResult.excelColumns?.length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Acordeón de Ajuste de Mapeo */}
            <div className="border border-border rounded-xl overflow-hidden bg-card">
              <button
                type="button"
                onClick={() => setShowMappingAccordion(!showMappingAccordion)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        showMappingAccordion ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-foreground">
                      Ajustar mapeo de columnas y ramos (Opcional)
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Modifica manualmente si alguna columna del archivo fue asignada incorrectamente.
                    </p>
                  </div>
                </div>
                <span className="text-xs text-primary font-medium">
                  {showMappingAccordion ? 'Ocultar ajustes' : 'Ver / Personalizar'}
                </span>
              </button>

              {showMappingAccordion && (
                <div className="p-4 border-t border-border/60 space-y-6 bg-background/50">
                  {/* Mapeo de Columnas */}
                  <div>
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                      Correspondencia de Columnas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {CAMPOS_CLAVE.map((campo) => (
                        <div key={campo.id} className="space-y-1 bg-card p-3 rounded-lg border">
                          <Label className="text-xs font-medium text-foreground">{campo.label}</Label>
                          <Select
                            value={columnMapping[campo.id] || NONE_VALUE}
                            onValueChange={(val) => handleColumnMappingChange(campo.id, val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Seleccione columna..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[220px]">
                              <SelectItem value={NONE_VALUE} className="text-muted-foreground italic">
                                (Sin asignar)
                              </SelectItem>
                              {analysisResult.excelColumns?.map((col) => (
                                <SelectItem key={col} value={col}>
                                  {col}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mapeo de Ramos */}
                  {Object.keys(ramoMappings).length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-3">
                        Equivalencia de Ramos Detectados
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {Object.entries(ramoMappings).map(([rawRamo, mappedRamo]) => (
                          <div
                            key={rawRamo}
                            className="flex items-center justify-between gap-3 bg-card p-3 rounded-lg border"
                          >
                            <div className="truncate max-w-[180px]">
                              <span className="text-xs text-muted-foreground block">En el Excel:</span>
                              <span className="text-xs font-semibold text-foreground truncate block">
                                {rawRamo}
                              </span>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1">
                              <Select
                                value={mappedRamo || ''}
                                onValueChange={(val) => handleRamoMappingChange(rawRamo, val)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Ramo oficial..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px]">
                                  {analysisResult.ramosOficiales?.map((ramo) => (
                                    <SelectItem key={ramo} value={ramo}>
                                      {ramo}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tabla de Previsualización */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Vista Previa de Filas Mapeadas (Primeras {analysisResult.previewRows?.length || 0})
                </h4>
                <span className="text-xs text-muted-foreground">
                  Validación previa a la persistencia en base de datos
                </span>
              </div>

              <div className="border rounded-xl overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs">Póliza / Endoso</TableHead>
                      <TableHead className="text-xs">Cliente (Tomador)</TableHead>
                      <TableHead className="text-xs">DNI / CUIT</TableHead>
                      <TableHead className="text-xs">Ramo Resuelto</TableHead>
                      <TableHead className="text-xs">Bien Asegurado</TableHead>
                      <TableHead className="text-xs">Vigencia</TableHead>
                      <TableHead className="text-xs">Premio</TableHead>
                      <TableHead className="text-xs text-right">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!analysisResult.previewRows || analysisResult.previewRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-6 text-muted-foreground text-xs">
                          No se encontraron filas válidas para previsualizar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      analysisResult.previewRows.map((row, index) => (
                        <TableRow key={`preview-${index}`} className="text-xs">
                          <TableCell className="font-semibold text-primary">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span>{row.nroPza || '-'}</span>
                              {row.nroEndoso != null && row.nroEndoso > 0 && (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-medium bg-muted text-muted-foreground border">
                                  End. #{row.nroEndoso}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium max-w-[140px] truncate" title={row.clienteNombreCompleto}>
                            {row.clienteNombreCompleto || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{row.clienteDni || '-'}</TableCell>
                          <TableCell className="max-w-[120px] truncate" title={row.ramoResuelto}>
                            {row.ramoResuelto || '-'}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-muted-foreground" title={row.bienAsegurado}>
                            {row.bienAsegurado || '-'}
                          </TableCell>
                          <TableCell className="text-[11px] whitespace-nowrap">
                            {row.inicioVigencia && row.finVigencia
                              ? `${row.inicioVigencia} → ${row.finVigencia}`
                              : row.inicioVigencia || row.finVigencia || '-'}
                          </TableCell>
                          <TableCell className="font-medium tabular-nums">
                            {formatCurrency(row.premio)}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.estadoInferido === 'ACTIVA' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                Activa
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                {row.estadoInferido || 'Baja'}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: Resumen de Ejecución */}
        {step === 3 && executionResult && (
          <div className="space-y-6 py-4">
            <div className="text-center space-y-2">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold text-foreground">¡Importación Exitosa!</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Los datos de la cartera han sido procesados, sincronizados y persistidos de manera transaccional.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-card border rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Pólizas Creadas</span>
                  <ShieldPlus className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {executionResult.polizasCreadas}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1">Nuevas en el sistema</span>
              </div>

              <div className="bg-card border rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Endosos / Actualiz.</span>
                  <ShieldCheck className="h-4 w-4 text-sky-400" />
                </div>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {executionResult.polizasActualizadas}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1">Pólizas renovadas</span>
              </div>

              <div className="bg-card border rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Pólizas en Baja</span>
                  <ShieldAlert className="h-4 w-4 text-rose-400" />
                </div>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {executionResult.polizasMarcadasBaja}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1">Anuladas o vencidas</span>
              </div>

              <div className="bg-card border rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Clientes Nuevos</span>
                  <UserPlus className="h-4 w-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {executionResult.clientesNuevos}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1">Altas de tomadores</span>
              </div>

              <div className="bg-card border rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Clientes Unificados</span>
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {executionResult.clientesActualizados}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1">Mismo DNI / Tomador</span>
              </div>

              <div className="bg-card border rounded-xl p-4 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between text-muted-foreground mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Pólizas Procesadas</span>
                  <FileSpreadsheet className="h-4 w-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-foreground tabular-nums">
                  {executionResult.polizasUnicasProcesadas}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1">
                  De {executionResult.filasLeidas} filas leídas
                </span>
              </div>
            </div>

            {/* Advertencias si las hubiese */}
            {executionResult.advertencias && executionResult.advertencias.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span>Observaciones durante la importación ({executionResult.advertencias.length})</span>
                </div>
                <ul className="text-xs text-amber-200/90 list-disc list-inside space-y-1 max-h-[140px] overflow-y-auto">
                  {executionResult.advertencias.map((adv, idx) => (
                    <li key={`adv-${idx}`}>{adv}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-4 pt-3 border-t flex items-center justify-between">
          {step === 1 && (
            <>
              <Button type="button" variant="outline" onClick={onClose} disabled={isAnalyzing}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAnalizar}
                disabled={isAnalyzing || !selectedCompaniaId || !selectedFile}
                className="gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analizando Cartera...
                  </>
                ) : (
                  <>
                    Analizar Cartera <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isExecuting}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> Cambiar Archivo
              </Button>
              <Button
                type="button"
                onClick={handleEjecutar}
                disabled={isExecuting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando Cartera...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Confirmar e Importar Cartera
                  </>
                )}
              </Button>
            </>
          )}

          {step === 3 && (
            <Button
              type="button"
              onClick={handleFinalizar}
              className="w-full sm:w-auto ml-auto bg-primary text-primary-foreground"
            >
              Finalizar y Ver Actualizaciones
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportarCarteraModal;
