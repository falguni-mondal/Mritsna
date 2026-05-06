import axios from "axios";

// Core Base URL dynamically switching between Dev and Prod
const coreBaseURL = import.meta.env.MODE === "development" 
  ? "http://localhost:5000/api/v1" 
  : `${import.meta.env.VITE_BACKEND_URL}/api/v1`; 

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