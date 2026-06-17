import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const AuthLoader = () => (
  <div className="w-full min-h-screen bg-[#f8f8f8] flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#1a1a1a]"></div>
  </div>
);

//  Guest Guard: For /signin. If already verified, kick to dashboard.
export const GuestGuard = ({ children }) => {
  const { isAuthenticated, isVerified, isInitializing } = useSelector((state) => state.auth);

  // Freeze routing until the initial session check is complete
  if (isInitializing) return <AuthLoader />;

  if (isAuthenticated && isVerified) {
    return <Navigate to="/" replace />;
  }
  if (isAuthenticated && !isVerified) {
    return <Navigate to="/verify" replace />;
  }
  return children;
};

//  Verify Guard: For /verify. Must be authenticated, but NOT verified.
export const VerifyGuard = ({ children }) => {
  const { isAuthenticated, isVerified, isInitializing } = useSelector((state) => state.auth);

  // Freeze routing until the initial session check is complete
  if (isInitializing) return <AuthLoader />;

  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (isVerified) return <Navigate to="/" replace />;
  
  return children;
};

// 3. Admin Guard: For Dashboard. Must have passed both steps.
export const AdminGuard = ({ children }) => {
  const { isAuthenticated, isVerified, isInitializing } = useSelector((state) => state.auth);

  // Freeze routing until the initial session check is complete
  if (isInitializing) return <AuthLoader />;

  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!isVerified) return <Navigate to="/verify" replace />;

  return children;
};