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
        w-64 flex-shrink-0 border-r bg-card flex flex-col 
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 relative flex items-center justify-center px-6 border-b shrink-0">
          <img 
            src={logo} 
            alt="SegurAPI" 
            className="h-12 w-auto max-w-[180px] object-contain rounded"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 md:hidden" 
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink 
                key={item.path} 
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isActive 
                      ? 'bg-slate-800/60 text-white border border-slate-700/40 shadow-sm' 
                      : 'text-slate-400 hover:bg-slate-800/30 hover:text-slate-200 border border-transparent'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            )
          })}
        </nav>

        {/* Footer con los tres íconos fijados en la parte inferior */}
        <div className="p-3 border-t bg-card/60 flex items-center justify-around gap-1 shrink-0">
          {/* Cambiar Tema */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme} 
            className="text-muted-foreground hover:text-foreground cursor-pointer"
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {/* Notificaciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative text-muted-foreground hover:text-foreground cursor-pointer"
                title="Notificaciones"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background animate-pulse"></span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="center" sideOffset={8} className="w-80">
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

          {/* Avatar / Usuario y Cerrar sesión */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="group relative rounded-full p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                title="Usuario"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-foreground transition-colors text-sm font-medium border border-border group-hover:border-foreground/20">
                  {userInitial}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user?.nombre && <p className="font-medium text-foreground">{user.nombre}</p>}
                  <p className="w-[180px] truncate text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={logout} 
                className="text-destructive cursor-pointer hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Cerrar sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
