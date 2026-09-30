import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Shield, LineChart, UserCircle, X, Bell, Sun, Moon, LogOut } from 'lucide-react';
import logo from '../assets/logo.jpg';
import { Button } from './ui/button';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ThemeContext } from '../context/ThemeContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from './ui/dropdown-menu';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useContext(AuthContext);
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const { theme, toggleTheme } = useContext(ThemeContext);

  const userInitial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : 
                      user?.email ? user.email.charAt(0).toUpperCase() : 'U';

  const handleNotificationClick = (notif) => {
    if (!notif.leida) {
      markAsRead(notif.id);
    }
  };

  const navItems = [
    { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/clientes', name: 'Clientes', icon: Users },
    { path: '/polizas', name: 'Pólizas', icon: Shield },
    { path: '/reportes', name: 'Reportes', icon: LineChart },
    { path: '/perfil', name: 'Perfil', icon: UserCircle }
  ];

  return (
    <>
      {/* Overlay para móviles */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 flex-shrink-0 border-r border-border bg-sidebar flex flex-col 
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 relative flex items-center justify-center px-4 border-b border-border shrink-0">
          <div className="bg-[#f4f4f4] rounded-lg px-3 py-1 shadow-xs border border-slate-300/30 max-w-[180px] w-full flex items-center justify-center transition-opacity hover:opacity-95">
            <img 
              src={logo} 
              alt="SegurAPI" 
              className="h-9 w-auto max-w-[160px] object-contain mix-blend-multiply"
            />
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-3 md:hidden text-muted-foreground hover:text-foreground" 
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1.5">
          <div className="px-3 mb-2">
            <span className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider">
              Gestión
            </span>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={item.path} 
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg font-medium text-sm transition-all duration-150 ${
                    isActive 
                      ? 'bg-card text-foreground border border-border border-l-2 border-l-primary shadow-xs' 
                      : 'text-muted-foreground hover:bg-card/50 hover:text-foreground border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer con los dos niveles acordados */}
        <div className="p-3 border-t border-border bg-sidebar shrink-0 flex flex-col gap-2">
          {/* Nivel 1: Acciones rápidas (Tema y Notificaciones) */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-medium text-muted-foreground/70">Preferencias</span>
            <div className="flex items-center gap-1">
              {/* Cambiar Tema */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-card/60 cursor-pointer rounded-md transition-all duration-150 active:scale-95"
                title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* Notificaciones */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-card/60 cursor-pointer rounded-md transition-all duration-150 active:scale-95"
                    title="Notificaciones"
                  >
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive border-2 border-sidebar animate-pulse"></span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-80">
                  <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notificaciones</span>
                    {unreadCount > 0 && <span className="text-xs font-normal text-muted-foreground">{unreadCount} nuevas</span>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No tienes notificaciones
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <DropdownMenuItem 
                          key={notif.id} 
                          className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${!notif.leida ? 'bg-muted/50' : ''}`}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="flex items-center gap-2">
                            {!notif.leida && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                            <span className="font-medium text-sm">{notif.titulo}</span>
                          </div>
                          <span className="text-xs text-muted-foreground line-clamp-2 ml-3">{notif.mensaje}</span>
                          <span className="text-[10px] text-muted-foreground/70 mt-1 ml-3">{new Date(notif.fechaCreacion).toLocaleString()}</span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Nivel 2: Fila de usuario tipo SaaS con información real */}
          <div className="flex items-center justify-between gap-2.5 p-2 rounded-lg bg-card/40 border border-border/60 hover:border-border/90 transition-colors duration-150">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-foreground text-xs font-semibold shrink-0 border border-border">
                {userInitial}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-foreground truncate">
                  {user?.nombre || user?.email || 'Usuario'}
                </span>
                <span className="text-[11px] text-muted-foreground truncate">
                  {user?.rol || user?.email || ''}
                </span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md shrink-0 cursor-pointer transition-all duration-150 active:scale-95"
              title="Cerrar sesión"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
