import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { ThemeContext } from '../context/ThemeContext';
import { Bell, Sun, Moon, LogOut, Menu } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Button } from './ui/button';

const Navbar = ({ onMenuClick }) => {
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

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-6 bg-card border-b shrink-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground hover:text-foreground">
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background animate-pulse"></span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-2 p-0">
              <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-foreground text-sm font-medium">
                {userInitial}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                {user?.nombre && <p className="font-medium text-foreground">{user.nombre}</p>}
                <p className="w-[200px] truncate text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
