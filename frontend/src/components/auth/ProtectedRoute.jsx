import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  // FUTURE REDUX IMPLEMENTATION:
  // import { useSelector } from 'react-redux';
  // const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  
  const mockAuth = false; // Change to true to test the Dashboard

  if (!mockAuth) {
    // If not logged in, kick them to sign in
    return <Navigate to="/account/signin" replace />;
  }

  // If logged in, render the child routes (the Dashboard)
  return <Outlet />;
};

export default ProtectedRoute;