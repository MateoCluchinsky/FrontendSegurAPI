import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const Verificar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(() => {
    const params = new URLSearchParams(location.search);
    return location.state?.email || params.get('email') || '';
  });
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/usuarios/verificar', null, {
        params: { email, codigo }
      });
      setSuccess('¡Cuenta verificada exitosamente! Redirigiendo al login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al verificar. El código podría ser inválido o haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl border-border bg-card">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Verificar Cuenta
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Ingresa el código de 6 dígitos que enviamos a tu correo
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium border border-destructive/20">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium border border-emerald-500/20">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                type="email" 
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required 
                className="bg-background"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="codigo">Código de Verificación</Label>
              <Input 
                type="text" 
                id="codigo"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej. 123456"
                required 
                className="bg-background tracking-widest text-center text-lg font-mono"
              />
            </div>
            
            <Button type="submit" className="w-full mt-2" disabled={loading || !!success}>
              {loading ? 'Verificando...' : 'Verificar Cuenta'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-border pt-4">
          <p className="text-sm text-muted-foreground">
            <Link to="/login" className="text-primary font-medium hover:underline">
              Volver al Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Verificar;
