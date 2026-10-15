import { Menu } from 'lucide-react';
import { Button } from './ui/button';

const Navbar = ({ onMenuClick }) => {
  return (
    <header className="h-14 flex items-center justify-between px-4 bg-sidebar border-b border-border shrink-0 md:hidden">
      <Button variant="ghost" size="icon" className="cursor-pointer" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>
      <span className="font-semibold text-sm text-foreground">SegurAPI</span>
      <div className="w-9" /> {/* Espaciador para balance visual */}
    </header>
  );
};

export default Navbar;
