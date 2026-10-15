import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ShieldCheck, Mail, Sparkles, User } from 'lucide-react';

const Perfil = () => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Cargando información del perfil...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Mi Perfil</h1>
        <p className="text-muted-foreground mt-1">Gestiona tu información personal y los detalles de tu cuenta.</p>
      </div>

      <div className="max-w-2xl">
        <Card className="border-border bg-card shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-6 border-b border-border">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary font-bold text-2xl flex items-center justify-center">
                {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-foreground">{user.nombre}</CardTitle>
                <CardDescription className="text-muted-foreground">{user.rol || 'PRODUCTOR'}</CardDescription>
              </div>
            </div>

            {/* Insignia de Versión 1.0 Gratuita */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-3.5 w-3.5" />
              Acceso Completo (Versión 1.0)
            </div>
          </CardHeader>
          
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" /> Email
              </span>
              <span className="font-medium text-foreground">{user.email}</span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <User className="h-4 w-4" /> Rol de Usuario
              </span>
              <span className="font-medium text-foreground">{user.rol || 'PRODUCTOR'}</span>
            </div>
            
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Estado de Cuenta
              </span>
              <span className="font-semibold text-emerald-500">Activo</span>
            </div>

            <div className="flex items-center justify-between py-2">
              <span className="text-muted-foreground flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" /> Licencia y Plan
              </span>
              <span className="font-medium text-primary">Acceso Completo Gratuito</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Perfil;
