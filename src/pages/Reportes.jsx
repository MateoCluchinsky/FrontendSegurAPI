import { useState } from 'react';
import { descargarExcelPolizas } from '../services/reporteService';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react';

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
    <div className="flex flex-col gap-6 p-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Reportes y Estadísticas</h1>
        <p className="text-muted-foreground mt-1">Generación de informes exportables y análisis de datos de tus carteras.</p>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="flex flex-col items-center text-center p-8 border-border bg-card">
          <div className="p-5 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-4">
            <FileSpreadsheet className="h-12 w-12" />
          </div>
          <CardHeader className="p-0 mb-3">
            <CardTitle className="text-2xl font-bold text-foreground">Reporte General de Pólizas</CardTitle>
          </CardHeader>
          <CardContent className="p-0 mb-6 text-muted-foreground text-sm max-w-md">
            Descarga un documento Excel completo con el detalle de todas las pólizas activas en tu cartera agrupadas por cliente, listo para presentar o analizar.
          </CardContent>
          
          <Button 
            onClick={handleDownloadExcel} 
            disabled={loading}
            className="gap-2 px-8 py-6 text-base font-semibold shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Generando reporte...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Generar y Descargar Excel
              </>
            )}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default Reportes;
