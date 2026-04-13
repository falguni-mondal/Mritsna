import { Navigate, Outlet } from "react-router-dom";

const GuestRoute = () => {
  // FUTURE REDUX IMPLEMENTATION:
  // const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);
  
  const mockAuth = false; // Change to true to test the redirect

  if (mockAuth) {
    // If they are already logged in, kick them to the dashboard
    return <Navigate to="/account" replace />;
  }

  return <Outlet />;
};

export default GuestRoute;