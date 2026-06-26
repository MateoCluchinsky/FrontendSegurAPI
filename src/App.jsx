import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
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
import Perfil from './pages/Perfil';



function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ThemeProvider>
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
                  <Route path="/perfil" element={<Perfil />} />
                </Route>
              </Route>
              
              {/* Redirección por defecto */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </ThemeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
