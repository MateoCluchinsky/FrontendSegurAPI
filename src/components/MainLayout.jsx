import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import '../styles/Layout.css';

const MainLayout = () => {
  return (
    <div className="main-layout">
      <Sidebar />
      <div className="content-wrapper">
        <Navbar />
        <main className="main-content">
          {/* Aquí se renderizan dinámicamente las sub-rutas protegidas */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
