import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

// 1. Guest Guard: For /signin. If already verified, kick to dashboard.
export const GuestGuard = ({ children }) => {
  const { isAuthenticated, isVerified } = useSelector((state) => state.auth);

  if (isAuthenticated && isVerified) {
    return <Navigate to="/" replace />;
  }
  if (isAuthenticated && !isVerified) {
    return <Navigate to="/verify" replace />;
  }
  return children;
};

// 2. Verify Guard: For /verify. Must be authenticated, but NOT verified.
export const VerifyGuard = ({ children }) => {
  const { isAuthenticated, isVerified } = useSelector((state) => state.auth);

  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (isVerified) return <Navigate to="/" replace />;
  
  return children;
};

// 3. Admin Guard: For Dashboard. Must have passed both steps.
export const AdminGuard = ({ children }) => {
  const { isAuthenticated, isVerified } = useSelector((state) => state.auth);

  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  if (!isVerified) return <Navigate to="/verify" replace />;

  return children;
};