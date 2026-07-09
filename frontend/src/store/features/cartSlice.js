import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance'; 

// ==========================================
// LOCAL STORAGE HELPERS (DUMB GUEST CART)
// ==========================================
// We only ever load and save the "Identity" of the items, never the prices or currency.
const loadGuestCartIds = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('guest_cart_ids');
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch (error) {
    console.error("Failed to parse guest cart IDs:", error);
    return [];
  }
};

const saveGuestCartIds = (items) => {
  if (typeof window !== 'undefined') {
    // Strip everything except the essential identifiers before saving
    const dumbList = items.map(item => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity
    }));
    localStorage.setItem('guest_cart_ids', JSON.stringify(dumbList));
  }
};

// ==========================================
// ASYNC THUNKS (API CALLS)
// ==========================================

export const verifyStock = createAsyncThunk(
  'cart/verifyStock',
  async ({ productId, variantId, requestedQuantity }, thunkAPI) => {
    try {
      const response = await userAxios.post('/cart/check-stock', {
        productId, variantId, requestedQuantity
      });
      return response.data.data; 
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to verify stock';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch Cart for Logged-In Users
export const fetchUserCart = createAsyncThunk(
  'cart/fetchUserCart',
  async (_, thunkAPI) => {
    try {
      const response = await userAxios.get('/cart');
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

// NEW: Hydrate Cart for Guest Users
// Takes the dumb IDs from localStorage and gets the live math from the backend
export const hydrateGuestCartAPI = createAsyncThunk(
  'cart/hydrateGuestCartAPI',
  async (_, thunkAPI) => {
    try {
      const localItems = loadGuestCartIds();
      
      // If there's nothing in local storage, don't bother hitting the API
      if (localItems.length === 0) {
        return { data: { items: [], subTotal: 0 } }; 
      }

      const response = await userAxios.post('/cart/hydrate', { localItems });
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to hydrate guest cart');
    }
  }
);

export const addToCartDB = createAsyncThunk(
  'cart/addToCartDB',
  async (cartData, { dispatch, rejectWithValue }) => {
    try {
      await userAxios.post('/cart/add', cartData);
      dispatch(fetchUserCart()); 
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add item');
    }
  }
);

export const updateCartQuantityDB = createAsyncThunk(
  'cart/updateCartQuantityDB',
  async (cartData, { dispatch, rejectWithValue }) => {
    try {
      await userAxios.put('/cart/update', cartData);
      dispatch(fetchUserCart());
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update quantity');
    }
  }
);

export const removeFromCartDB = createAsyncThunk(
  'cart/removeFromCartDB',
  async (variantId, { dispatch, rejectWithValue }) => {
    try {
      await userAxios.delete(`/cart/remove/${variantId}`);
      dispatch(fetchUserCart());
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove item');
    }
  }
);

// Clear Cart in DB upon successful purchase
export const clearCartDB = createAsyncThunk(
  'cart/clearCartDB',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await userAxios.delete('/cart/clear'); // Adjust route if your clear route differs (e.g., POST /cart/clear)
      dispatch(fetchUserCart());
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
    }
  }
);

export const syncGuestCartToDB = createAsyncThunk(
  'cart/syncGuestCartToDB',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      // Read the dumb list directly from local storage for syncing
      const localItems = loadGuestCartIds();
      
      if (localItems.length > 0) {
        await userAxios.post('/cart/sync', { localItems });
        dispatch(clearLocalCart());
      }
      
      dispatch(fetchUserCart());
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sync cart');
    }
  }
);


// ==========================================
// REDUX SLICE
// ==========================================

const initialState = {
  // We initialize with empty values because we must wait for the hydration API to run
  items: [],
  subTotal: 0,
  isLoading: false, // Will turn true on mount if there are IDs to hydrate
  isError: false,
  message: '',
  currencySymbol: '₹',
  currencyCode: 'INR',
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // We update local state optimistically, save the dumb IDs to storage, 
    // but the actual visual data will be handled by the UI or a subsequent hydration call.
    addLocalItem: (state, action) => {
      const newItem = action.payload;
      const existingIndex = state.items.findIndex(item => item.variantId === newItem.variantId);

      if (existingIndex > -1) {
        const combinedQty = state.items[existingIndex].quantity + newItem.quantity;
        state.items[existingIndex].quantity = Math.min(combinedQty, 5, newItem.maxLimit || 5);
      } else {
        state.items.push(newItem);
      }

      saveGuestCartIds(state.items);
    },

    updateLocalQuantity: (state, action) => {
      const { variantId, quantity } = action.payload;
      const existingItem = state.items.find(item => item.variantId === variantId);

      if (existingItem) {
        existingItem.quantity = quantity;
        saveGuestCartIds(state.items);
      }
    },

    removeLocalItem: (state, action) => {
      const variantId = action.payload;
      state.items = state.items.filter(item => item.variantId !== variantId);
      saveGuestCartIds(state.items);
    },

    clearLocalCart: (state) => {
      state.items = [];
      state.subTotal = 0;
      localStorage.removeItem('guest_cart_ids');
      // Also clean up the old storage key just in case a returning user has it
      localStorage.removeItem('guest_cart'); 
    },

    clearCartErrors: (state) => {
      state.isError = false;
      state.message = '';
    }
  },
  
  extraReducers: (builder) => {
    // Helper function to handle fulfilling both user and guest carts
    const handleCartFulfilled = (state, action) => {
      state.isLoading = false;
      const payloadData = action.payload?.data || action.payload || {};
      
      state.items = payloadData.items || [];
      state.subTotal = payloadData.subTotal || 0;
      
      // Look for currency info in either the root payload or the nested data object
      if (action.payload?.currencySymbol || payloadData.currencySymbol) {
        state.currencySymbol = action.payload?.currencySymbol || payloadData.currencySymbol;
      }
      if (action.payload?.currencyCode || payloadData.currencyCode) {
        state.currencyCode = action.payload?.currencyCode || payloadData.currencyCode;
      }
    };

    builder
      // --- LOGGED IN CART FLOW ---
      .addCase(fetchUserCart.pending, (state) => { state.isLoading = true; })
      .addCase(fetchUserCart.fulfilled, handleCartFulfilled)
      .addCase(fetchUserCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- GUEST HYDRATION FLOW ---
      .addCase(hydrateGuestCartAPI.pending, (state) => { state.isLoading = true; })
      .addCase(hydrateGuestCartAPI.fulfilled, handleCartFulfilled)
      .addCase(hydrateGuestCartAPI.rejected, (state, action) => {
        state.isLoading = false;
        // Don't show a massive error if hydration fails, just leave it empty to prevent crashing
        console.error("Hydration failed:", action.payload); 
      })

      // --- DB MUTATIONS ---
      .addCase(addToCartDB.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(addToCartDB.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(addToCartDB.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      .addCase(updateCartQuantityDB.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(removeFromCartDB.rejected, (state, action) => {
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { 
  addLocalItem, 
  updateLocalQuantity, 
  removeLocalItem, 
  clearLocalCart, 
  clearCartErrors 
} = cartSlice.actions;

export default cartSlice.reducer;