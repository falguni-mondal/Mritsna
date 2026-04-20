import React from "react";
import { Route, Routes } from "react-router-dom";
import Homepage from "../pages/Homepage";
import About from "../pages/About";
import Shop from "../pages/Shop";
import Product from "../pages/Product";
import SignIn from "../pages/Signin";
import SignUp from "../pages/SignUp";
import Verification from "../pages/Verification";
import Dashboard from "../pages/Dashboard";
import GuestRoute from "../components/auth/GuestRoute";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import NotFound from "../pages/NotFound";

const PageRouter = () => {
  return (
    <Routes>
      {/* ==========================================
          PUBLIC ROUTES
      ========================================== */}
      <Route path="/" element={<Homepage />} />
      <Route path="/about" element={<About />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/product/:id" element={<Product />} />

      {/* ==========================================
          GUEST ROUTES (Only accessible if NOT logged in)
      ========================================== */}
      <Route 
        path="/account/signin" 
        element={
          <GuestRoute>
            <SignIn />
          </GuestRoute>
        } 
      />
      
      <Route 
        path="/account/signup" 
        element={
          <GuestRoute>
            <SignUp />
          </GuestRoute>
        } 
      />

      {/* ==========================================
          SEMI-PROTECTED: VERIFICATION PAGE 
          (Must be logged in, but UNVERIFIED)
      ========================================== */}
      <Route 
        path="/account/verify" 
        element={
          <ProtectedRoute requireVerification={false}>
            <Verification />
          </ProtectedRoute>
        } 
      />

      {/* ==========================================
          FULLY PROTECTED ROUTES 
          (Must be logged in AND Verified)
      ========================================== */}
      <Route 
        path="/account" 
        element={
          <ProtectedRoute requireVerification={true}>
            <Dashboard />
          </ProtectedRoute>
        } 
      />



      <Route path="*" element={<NotFound />} />
      
      {/* Example of future nested routes */}
      {/* <Route 
        path="/account/orders" 
        element={
          <ProtectedRoute requireVerification={true}>
            <Orders />
          </ProtectedRoute>
        } 
      /> 
      */}
      
    </Routes>
  );
};

export default PageRouter;