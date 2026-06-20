import { NavLink } from 'react-router-dom';
import '../styles/Layout.css';

const Sidebar = () => {
  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: '📊' },
    { path: '/clientes', name: 'Clientes', icon: '👥' },
    { path: '/polizas', name: 'Pólizas', icon: '🛡️' },
    { path: '/reportes', name: 'Reportes', icon: '📈' },
    { path: '/perfil', name: 'Perfil', icon: '👤' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        SegurAPI
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
