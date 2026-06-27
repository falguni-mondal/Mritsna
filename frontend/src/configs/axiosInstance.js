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

// --- REQUEST INTERCEPTOR ---
// Automatically injects the user's location into every API request
userAxios.interceptors.request.use(
  (config) => {
    try {
      // FIX: Only inject the header if it hasn't been manually set by the API call!
      if (!config.headers["x-user-region"]) {
        const storedRegion = localStorage.getItem("user_region");
        if (storedRegion) {
          const { countryCode } = JSON.parse(storedRegion);
          if (countryCode) {
            config.headers["x-user-region"] = countryCode; 
          }
        }
      }
    } catch (error) {
      console.warn("[User HTTP] Failed to parse region for headers:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- EXISTING: RESPONSE INTERCEPTOR ---
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