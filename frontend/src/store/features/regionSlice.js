import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance';

// --- SYNCHRONOUS BOOTSTRAP ---
// We read from localStorage immediately so returning users never see a loading flicker
const loadRegionFromStorage = () => {
  try {
    const stored = localStorage.getItem('user_region');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn('[Region Slice] Failed to parse region from local storage:', error);
    return null;
  }
};

const initialState = {
  data: loadRegionFromStorage(),
  // If we already have data from storage, we don't need to show a loader
  isLoading: !loadRegionFromStorage(), 
  error: null,
};

// --- THE DETECTION THUNK ---
// Called by App.jsx only if initialState.data is null
export const fetchUserRegion = createAsyncThunk(
  'region/fetchUserRegion',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userAxios.get('/region/detect');
      const regionData = response.data.data;
      
      // Save it immediately so the next visit is perfectly synchronous
      localStorage.setItem('user_region', JSON.stringify(regionData));
      
      return regionData;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to detect region via IP');
    }
  }
);

const regionSlice = createSlice({
  name: 'region',
  initialState,
  reducers: {
    // Used when the user manually changes their country via the Navbar Dropdown
    setManualRegion: (state, action) => {
      state.data = action.payload;
      state.isLoading = false;
      localStorage.setItem('user_region', JSON.stringify(action.payload));
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserRegion.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserRegion.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(fetchUserRegion.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        
        // Critical Fallback: If the IP API is completely down, default to INR 
        // so the e-commerce store continues to function.
        if (!state.data) {
          state.data = { countryCode: "IN", currencyCode: "INR", symbol: "₹", rate: 1 };
          localStorage.setItem('user_region', JSON.stringify(state.data));
        }
      });
  }
});

export const { setManualRegion } = regionSlice.actions;
export default regionSlice.reducer;