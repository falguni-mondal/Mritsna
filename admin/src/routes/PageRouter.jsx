import React from "react";
import { Routes, Route } from "react-router-dom";
import { GuestGuard, VerifyGuard, AdminGuard } from "./Guards";

// Pages
import SignIn from "../pages/auth/SignIn";
import Verification from "../pages/auth/Verification";

// Temporary Dashboard Component
const Dashboard = () => <div className="p-20 text-4xl head-font">Welcome to Command Center</div>;

const PageRouter = () => {
  return (
    <Routes>
      {/* Step 1: Sign In */}
      <Route path="/signin" element={<GuestGuard><SignIn /></GuestGuard>} />
      
      {/* Step 2: OTP Verification */}
      <Route path="/verify" element={<VerifyGuard><Verification /></VerifyGuard>} />
      
      {/* Step 3: Protected Admin Area */}
      <Route path="/" element={<AdminGuard><Dashboard /></AdminGuard>} />
      
      {/* Catch All */}
      <Route path="*" element={<div className="p-20">404 - Admin Route Not Found</div>} />
    </Routes>
  );
};

export default PageRouter;