import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance'; 

// ==========================================
// LOCAL STORAGE HELPERS (GUEST WISHLIST)
// ==========================================
const loadGuestWishlist = () => {
  if (typeof window === 'undefined') return { items: [] };
  try {
    const saved = localStorage.getItem('guest_wishlist');
    return saved ? JSON.parse(saved) : { items: [] };
  } catch (error) {
    console.error("Failed to parse guest wishlist:", error);
    return { items: [] };
  }
};

const saveGuestWishlist = (items) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('guest_wishlist', JSON.stringify({ items }));
  }
};

// ==========================================
// ASYNC THUNKS (API CALLS)
// ==========================================

// Fetch Authenticated User Wishlist
export const fetchUserWishlist = createAsyncThunk(
  'wishlist/fetchUserWishlist',
  async (_, thunkAPI) => {
    try {
      const response = await userAxios.get('/wishlist');
      // The backend returns an array of items inside data.items
      return response.data.data.items || [];
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

// Toggle Item in DB (Add/Remove)
export const toggleWishlistDB = createAsyncThunk(
  'wishlist/toggleWishlistDB',
  async ({ productId, variantId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await userAxios.post('/wishlist/toggle', { productId, variantId });
      
      // Immediately fetch the fresh wishlist to guarantee sync with DB
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
      const saved = localStorage.getItem('guest_wishlist');
      const localData = saved ? JSON.parse(saved) : { items: [] };
      const items = localData.items || [];
      
      if (items.length > 0) {
        // --- THE BULLETPROOF PAYLOAD ---
        // We map both variations of the property names so Mongoose doesn't strip them
        const syncPayload = items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          product: item.productId, // Fallback for Mongoose schema
          variant: item.variantId  // Fallback for Mongoose schema
        }));

        // We send it keyed as BOTH localItems and items so the controller finds it
        await userAxios.post('/wishlist/sync', { 
          localItems: syncPayload, 
          items: syncPayload 
        });
        
        // Manually nuke the local storage right here to guarantee deletion
        localStorage.removeItem('guest_wishlist');
        dispatch({ type: 'wishlist/clearLocalWishlist' });
      }
      
      // Fetch the newly merged DB wishlist
      dispatch(fetchUserWishlist());
      return true;
    } catch (error) {
      console.error("WISHLIST SYNC FAILED. Backend response:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to sync wishlist');
    }
  }
);

// ==========================================
// REDUX SLICE
// ==========================================
const initialGuestWishlist = loadGuestWishlist();

const initialState = {
  items: initialGuestWishlist.items,
  isLoading: false,
  isError: false,
  message: '',
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

      saveGuestWishlist(state.items);
    },

    clearLocalWishlist: (state) => {
      state.items = [];
      localStorage.removeItem('guest_wishlist');
    },

    clearWishlistErrors: (state) => {
      state.isError = false;
      state.message = '';
    }
  },
  
  extraReducers: (builder) => {
    builder
      // --- FETCH USER WISHLIST ---
      .addCase(fetchUserWishlist.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(fetchUserWishlist.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
      })
      .addCase(fetchUserWishlist.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- TOGGLE DB WISHLIST ---
      .addCase(toggleWishlistDB.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(toggleWishlistDB.fulfilled, (state) => {
        state.isLoading = false;
      })
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