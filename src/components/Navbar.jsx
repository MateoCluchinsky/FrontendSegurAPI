import { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ThemeContext } from '../context/ThemeContext';
import '../styles/Layout.css';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Obtener la inicial del usuario para el avatar
  const userInitial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : 
                      user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  // Cerrar el dropdown al hacer clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNotificationClick = (notif) => {
    if (!notif.leida) {
      markAsRead(notif.id);
    }
    // Opcional: Navegar a alguna ruta si la notificación tiene un link o actionType
  };

  return (
    <header className="navbar">
      <div className="navbar-right">
        
        {/* Toggle Theme */}
        <button onClick={toggleTheme} className="theme-toggle-btn" style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', marginRight: '10px' }} title="Cambiar Tema">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Campanita de Notificaciones */}
        <div className="notification-bell-container" ref={dropdownRef}>
          <div className="notification-bell" onClick={toggleDropdown}>
            <span>🔔</span>
            {unreadCount > 0 && (
              <span className="badge bounce-animation">{unreadCount}</span>
            )}
          </div>
          
          {/* Dropdown de Notificaciones */}
          <div className={`notification-dropdown ${isDropdownOpen ? 'open' : ''}`}>
            <div className="notification-header">
              <h3>Notificaciones</h3>
              {unreadCount > 0 && <span className="unread-text">{unreadCount} sin leer</span>}
            </div>
            
            <div className="notification-list custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  No tienes notificaciones
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`notification-item ${!notif.leida ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    {!notif.leida && <div className="unread-dot"></div>}
                    <div className="notification-content">
                      <div className="notification-title">{notif.titulo}</div>
                      <div className="notification-message">{notif.mensaje}</div>
                      <div className="notification-time">
                        {new Date(notif.fechaCreacion).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Información del Usuario */}
        <div className="user-profile">
          <div className="user-info">
            <span className="user-name">{user?.nombre || user?.email || 'Usuario'}</span>
            <span className="user-role">{user?.rol || 'Administrador'}</span>
          </div>
          <div className="avatar">
            {userInitial}
          </div>
        </div>

        {/* Botón de Cerrar Sesión */}
        <button onClick={logout} className="logout-btn">
          Cerrar Sesión
        </button>

      </div>
    </header>
  );
};

export default Navbar;
