import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

// Páginas de Autenticación
import Login from './pages/Login';
import Registro from './pages/Registro';
import Verificar from './pages/Verificar';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Polizas from './pages/Polizas';
import Reportes from './pages/Reportes';

// Placeholders Temporales para Rutas Protegidas
const PagePlaceholder = ({ title, desc }) => (
  <div className="page-container">
    <div className="page-header">
      <h1 className="page-title">{title}</h1>
      <p className="page-description">{desc}</p>
    </div>
    <div className="placeholder-card">
      <p>El contenido de este módulo se implementará próximamente.</p>
    </div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Rutas Públicas */}
            <Route path="/login" element={<Login />} />
            <Route path="/registro" element={<Registro />} />
            <Route path="/verificar" element={<Verificar />} />
            
            {/* Rutas Protegidas bajo ProtectedRoute */}
            <Route element={<ProtectedRoute />}>
              {/* El MainLayout envuelve las rutas que comparten la estructura visual */}
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clientes" element={<Clientes />} />
                <Route path="/polizas" element={<Polizas />} />
                <Route path="/reportes" element={<Reportes />} />
                <Route path="/perfil" element={
                  <PagePlaceholder 
                    title="Mi Perfil" 
                    desc="Configura tu cuenta y tus preferencias de usuario." 
                  />
                } />
              </Route>
            </Route>
            
            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
