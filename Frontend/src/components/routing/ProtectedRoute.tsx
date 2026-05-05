import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

type ProtectedRouteProps = {
  children: React.ReactElement;
};

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

