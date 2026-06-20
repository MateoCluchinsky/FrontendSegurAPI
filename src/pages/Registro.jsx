import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/Auth.css';

const Registro = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/usuarios/registro', formData);
      navigate('/verificar', { state: { email: formData.email } });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error al registrar el usuario. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <h2>Crear Cuenta</h2>
          <p>Únete a SegurAPI hoy mismo</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input 
              type="text" 
              id="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej. Juan Pérez"
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com"
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input 
              type="password" 
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Crea una contraseña segura"
              required 
            />
          </div>
          
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>¿Ya tienes una cuenta? <Link to="/login">Inicia Sesión</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Registro;
