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
userAxios.interceptors.request.use(
  (config) => {
    try {
      if (!config.headers["x-user-region"]) {
        const storedRegion = localStorage.getItem("user_region");
        if (storedRegion) {
          const { countryCode } = JSON.parse(storedRegion);
          if (countryCode) {
            config.headers["x-user-region"] = countryCode; 
          }
        }
      }

      // 2. UTM Parameter Extraction & Injection
      // We only inject these into GET requests so we don't accidentally bloat POST/PUT payloads
      if (config.method?.toLowerCase() === 'get' && typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        
        const utmSource = searchParams.get('utm_source');
        const utmMedium = searchParams.get('utm_medium');
        const utmCampaign = searchParams.get('utm_campaign');

        // If any UTM parameter exists in the browser URL, attach it to the Axios request
        if (utmSource || utmMedium || utmCampaign) {
          // Ensure config.params exists before assigning to it
          config.params = config.params || {};
          
          if (utmSource) config.params.utm_source = utmSource;
          if (utmMedium) config.params.utm_medium = utmMedium;
          if (utmCampaign) config.params.utm_campaign = utmCampaign;
        }
      }

    } catch (error) {
      console.warn("[User HTTP] Failed to parse request modifiers:", error);
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