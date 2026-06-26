import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { obtenerLinkPagoPremium } from '../services/pagoService';

const Perfil = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = await obtenerLinkPagoPremium();
      // Redirigir al usuario al link de MercadoPago
      window.location.href = url;
    } catch (err) {
      console.error("Error al obtener link de pago:", err);
      setError("No se pudo conectar con MercadoPago. Por favor, intenta más tarde.");
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="page-container"><p>Cargando información del perfil...</p></div>;
  }

  const isPremium = user.plan === 'PREMIUM';

  return (
    <div className="page-container fade-in">
      <div className="page-header">
        <h1 className="page-title">Mi Perfil</h1>
        <p className="page-description">Gestiona tu información personal y el estado de tu suscripción.</p>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      <div className="charts-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {/* Tarjeta de Información del Usuario */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%', 
              background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: '1.5rem', fontWeight: 'bold'
            }}>
              {user.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'white' }}>{user.nombre}</h2>
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{user.rol}</p>
            </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Email</span>
              <span style={{ color: 'white', fontWeight: '500' }}>{user.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Estado</span>
              <span style={{ color: '#10b981', fontWeight: '500' }}>Activo</span>
            </div>
          </div>
        </div>

        {/* Tarjeta de Suscripción / MercadoPago */}
        <div className="chart-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '2rem', border: isPremium ? '2px solid #10b981' : '1px solid var(--border-color)' }}>
          <div style={{ 
            background: isPremium ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)', 
            color: isPremium ? '#34d399' : '#3b82f6', 
            padding: '1rem', borderRadius: '50%', marginBottom: '1rem', fontSize: '2rem' 
          }}>
            {isPremium ? '👑' : '⭐'}
          </div>
          <h2 style={{ color: 'white', marginBottom: '0.5rem' }}>
            Plan Actual: {isPremium ? 'PREMIUM' : 'BÁSICO'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', minHeight: '3rem' }}>
            {isPremium 
              ? 'Disfrutas de todas las funcionalidades avanzadas, incluyendo notificaciones en tiempo real y métricas avanzadas.'
              : 'Actualiza tu plan para desbloquear reportes ilimitados, alertas SMS y herramientas avanzadas de análisis de cartera.'}
          </p>

          {!isPremium && (
            <button 
              onClick={handleUpgrade}
              disabled={loading}
              style={{
                background: loading ? 'var(--bg-secondary)' : '#009ee3', // Color oficial MercadoPago
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
                width: '100%',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={(e) => !loading && (e.currentTarget.style.transform = 'none')}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: '20px', height: '20px', borderTopColor: 'white', margin: 0 }}></div>
                  Conectando...
                </>
              ) : (
                '💳 Mejorar a Premium'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Perfil;
