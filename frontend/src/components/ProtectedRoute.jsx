import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AccessDenied from './AccessDenied';

// roles (opsional): daftar peran yang boleh masuk, misalnya ['admin']
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="muted" style={{ padding: 24 }}>Memuat...</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (roles && !roles.includes(user.role)) {
    return <AccessDenied />;
  }
  return children;
}
