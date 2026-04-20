import axios from "axios";

// Core Base URL dynamically switching between Dev and Prod
const coreBaseURL = import.meta.env.MODE === "development" 
  ? "http://localhost:5000/api/v1" 
  : `${import.meta.env.VITE_BACKEND_URL}/api/v1`; 

// ==========================================
// 1. STANDARD USER INSTANCE
// ==========================================
export const userAxios = axios.create({
  baseURL: coreBaseURL, 
  withCredentials: true, // Always sends the HTTP-only cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: User Interceptor
// Catches global errors like 401s before they even hit your Redux slices
userAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("[User HTTP] Unauthorized or session expired.");
      // You can add logic here later to refresh tokens or clear local state
    }
    return Promise.reject(error);
  }
);


// ==========================================
// 2. ADMIN SECURE INSTANCE
// ==========================================
export const adminAxios = axios.create({
  baseURL: `${coreBaseURL}/admin`, // Automatically prefixes /admin to all admin calls
  withCredentials: true, 
  headers: {
    "Content-Type": "application/json",
  },
});

// Admin-Specific Interceptor
adminAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    // 403 Forbidden means they are logged in but lack 'admin' role
    // 401 means their token expired
    if (error.response?.status === 401 || error.response?.status === 403) {
      console.error("[Admin HTTP] Security Violation. Redirecting to safe zone.");
      // Hard redirect to kick them out of the admin dashboard immediately
      // window.location.href = '/account/signin'; 
    }
    return Promise.reject(error);
  }
);