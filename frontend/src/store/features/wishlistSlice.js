import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance'; 

// ==========================================
// LOCAL STORAGE HELPERS (DUMB GUEST WISHLIST)
// ==========================================
const loadGuestWishlistIds = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('guest_wishlist_ids');
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (error) {
    console.error("Failed to parse guest wishlist IDs:", error);
    return [];
  }
};

const saveGuestWishlistIds = (items) => {
  if (typeof window !== 'undefined') {
    // Strip everything except the essential identifiers before saving
    const dumbList = items.map(item => ({
      productId: item.productId,
      variantId: item.variantId
    }));
    localStorage.setItem('guest_wishlist_ids', JSON.stringify(dumbList));
  }
};

// ==========================================
// ASYNC THUNKS (API CALLS)
// ==========================================

// Fetch Authenticated User Wishlist (Backend handles pricing)
export const fetchUserWishlist = createAsyncThunk(
  'wishlist/fetchUserWishlist',
  async (_, thunkAPI) => {
    try {
      const response = await userAxios.get('/wishlist');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

// NEW: Hydrate Guest Wishlist (Backend handles pricing based on dumb IDs)
export const hydrateGuestWishlistAPI = createAsyncThunk(
  'wishlist/hydrateGuestWishlistAPI',
  async (_, thunkAPI) => {
    try {
      const localItems = loadGuestWishlistIds();
      
      if (localItems.length === 0) {
        return { data: { items: [] } }; 
      }

      const response = await userAxios.post('/wishlist/hydrate', { localItems });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to hydrate guest wishlist');
    }
  }
);

// Toggle Item in DB (Add/Remove)
export const toggleWishlistDB = createAsyncThunk(
  'wishlist/toggleWishlistDB',
  async ({ productId, variantId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await userAxios.post('/wishlist/toggle', { productId, variantId });
      // Immediately fetch the fresh wishlist to guarantee sync with DB and pricing engine
      dispatch(fetchUserWishlist()); 
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update wishlist');
    }
  }
);

// Sync Guest Wishlist to DB
export const syncGuestWishlistToDB = createAsyncThunk(
  'wishlist/syncGuestWishlistToDB',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Read the dumb IDs directly
      const localItems = loadGuestWishlistIds();
      
      if (localItems.length > 0) {
        await userAxios.post('/wishlist/sync', { localItems });
        
        // Nuke the local storage and old keys
        localStorage.removeItem('guest_wishlist_ids');
        localStorage.removeItem('guest_wishlist');
        dispatch({ type: 'wishlist/clearLocalWishlist' });
      }
      
      dispatch(fetchUserWishlist());
      return true;
    } catch (error) {
      console.error("WISHLIST SYNC FAILED:", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to sync wishlist');
    }
  }
);


// ==========================================
// REDUX SLICE
// ==========================================

const initialState = {
  items: [], // Initialized empty, waiting for hydration
  isLoading: false,
  isError: false,
  message: '',
  currencySymbol: '₹',
  currencyCode: 'INR',
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    // --- GUEST WISHLIST ACTIONS (LOCAL ONLY) ---
    toggleLocalItem: (state, action) => {
      const newItem = action.payload; 
      
      const existingIndex = state.items.findIndex(
        item => item.productId === newItem.productId && item.variantId === newItem.variantId
      );

      if (existingIndex > -1) {
        state.items.splice(existingIndex, 1);
      } else {
        state.items.unshift(newItem);
      }

      // Save only the dumb IDs to local storage
      saveGuestWishlistIds(state.items);
    },

    clearLocalWishlist: (state) => {
      state.items = [];
      localStorage.removeItem('guest_wishlist_ids');
      localStorage.removeItem('guest_wishlist');
    },

    clearWishlistErrors: (state) => {
      state.isError = false;
      state.message = '';
    }
  },
  
  extraReducers: (builder) => {
    // Helper function to handle fulfilling both user and guest wishlists
    const handleWishlistFulfilled = (state, action) => {
      state.isLoading = false;
      const payloadData = action.payload?.data || action.payload || {};
      
      state.items = payloadData.items || [];
      
      if (action.payload?.currencySymbol || payloadData.currencySymbol) {
        state.currencySymbol = action.payload?.currencySymbol || payloadData.currencySymbol;
      }
      if (action.payload?.currencyCode || payloadData.currencyCode) {
        state.currencyCode = action.payload?.currencyCode || payloadData.currencyCode;
      }
    };

    builder
      // --- FETCH USER WISHLIST ---
      .addCase(fetchUserWishlist.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(fetchUserWishlist.fulfilled, handleWishlistFulfilled)
      .addCase(fetchUserWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- HYDRATE GUEST WISHLIST ---
      .addCase(hydrateGuestWishlistAPI.pending, (state) => { state.isLoading = true; })
      .addCase(hydrateGuestWishlistAPI.fulfilled, handleWishlistFulfilled)
      .addCase(hydrateGuestWishlistAPI.rejected, (state, action) => {
        state.isLoading = false;
        console.error("Wishlist hydration failed:", action.payload); 
      })

      // --- TOGGLE DB WISHLIST ---
      .addCase(toggleWishlistDB.pending, (state) => { state.isLoading = true; state.isError = false; })
      .addCase(toggleWishlistDB.fulfilled, (state) => { state.isLoading = false; })
      .addCase(toggleWishlistDB.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // --- SYNC GUEST WISHLIST ---
      .addCase(syncGuestWishlistToDB.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { 
  toggleLocalItem, 
  clearLocalWishlist, 
  clearWishlistErrors 
} = wishlistSlice.actions;

export default wishlistSlice.reducer;