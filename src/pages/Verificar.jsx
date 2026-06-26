import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/Auth.css';

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
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h2>Verificar Cuenta</h2>
          <p>Ingresa el código que enviamos a tu correo</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="codigo">Código</label>
            <input 
              type="text" 
              id="codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Ej. 123456"
              required 
            />
          </div>
          
          <button type="submit" className="auth-btn" disabled={loading || !!success}>
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p><Link to="/login">Volver al Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Verificar;
