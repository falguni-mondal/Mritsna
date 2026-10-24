import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance'; 

// ==========================================
// LOCAL STORAGE HELPERS (DUMB GUEST CART + LEGACY MIGRATION)
// ==========================================
const loadGuestCartIds = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('guest_cart_ids') || localStorage.getItem('guest_cart');
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

// Hydrate & Persist Guest Cart to MongoDB
// Always calls /cart/hydrate (even when localItems is empty) so removals/clears and admin force-clears stay in sync
export const hydrateGuestCartAPI = createAsyncThunk(
  'cart/hydrateGuestCartAPI',
  async (options = {}, thunkAPI) => {
    try {
      const localItems = loadGuestCartIds();
      const isMutation = Boolean(options?.isMutation);

      const response = await userAxios.post('/cart/hydrate', { localItems, isMutation });
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
      await userAxios.delete('/cart/clear'); 
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
      const localItems = loadGuestCartIds();
      
      // Always hit /cart/sync on login/verify so any shadow guest cart in DB for this device_id is cleaned up
      await userAxios.post('/cart/sync', { localItems });
      dispatch(clearLocalCart());
      
      dispatch(fetchUserCart());
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sync cart');
    }
  }
);

// ==========================================
// REDUX SLICE & INSTANT MATH ENGINE
// ==========================================

const recalculateLocalMath = (state) => {
  state.subTotal = state.items.reduce((total, item) => {
    const itemPrice = item.price || 0; 
    item.itemTotal = itemPrice * item.quantity;
    return total + item.itemTotal;
  }, 0);
};

const initialState = {
  items: [],
  subTotal: 0,
  isLoading: false, 
  isError: false,
  message: '',
  currencySymbol: '₹',
  currencyCode: 'INR',
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addLocalItem: (state, action) => {
      const newItem = action.payload;
      const existingIndex = state.items.findIndex(item => item.variantId === newItem.variantId);

      if (existingIndex > -1) {
        const combinedQty = state.items[existingIndex].quantity + newItem.quantity;
        const limit = newItem.maxLimit !== undefined ? newItem.maxLimit : 5;
        state.items[existingIndex].quantity = Math.min(combinedQty, 5, limit);
      } else {
        state.items.push(newItem);
      }

      saveGuestCartIds(state.items);
      recalculateLocalMath(state);
    },

    updateLocalQuantity: (state, action) => {
      const { variantId, quantity } = action.payload;
      const existingItem = state.items.find(item => item.variantId === variantId);

      if (existingItem) {
        existingItem.quantity = quantity;
        saveGuestCartIds(state.items);
        recalculateLocalMath(state);
      }
    },

    removeLocalItem: (state, action) => {
      const variantId = action.payload;
      state.items = state.items.filter(item => item.variantId !== variantId);
      saveGuestCartIds(state.items);
      recalculateLocalMath(state);
    },

    clearLocalCart: (state) => {
      state.items = [];
      state.subTotal = 0;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('guest_cart_ids');
        localStorage.removeItem('guest_cart'); 
      }
    },

    clearCartErrors: (state) => {
      state.isError = false;
      state.message = '';
    }
  },
  
  extraReducers: (builder) => {
    const handleCartFulfilled = (state, action) => {
      state.isLoading = false;
      const payloadData = action.payload?.data || action.payload || {};
      
      // If an admin forcibly cleared this guest cart in the Admin Drawer, wipe localStorage too
      if (payloadData.forceClearedByAdmin && typeof window !== 'undefined') {
        localStorage.removeItem('guest_cart_ids');
        localStorage.removeItem('guest_cart');
      }

      state.items = payloadData.items || [];
      state.subTotal = payloadData.subTotal || 0;
      
      if (action.payload?.currencySymbol || payloadData.currencySymbol) {
        state.currencySymbol = action.payload?.currencySymbol || payloadData.currencySymbol;
      }
      if (action.payload?.currencyCode || payloadData.currencyCode) {
        state.currencyCode = action.payload?.currencyCode || payloadData.currencyCode;
      }
    };

    builder
      .addCase(fetchUserCart.pending, (state) => { state.isLoading = true; })
      .addCase(fetchUserCart.fulfilled, handleCartFulfilled)
      .addCase(fetchUserCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      .addCase(hydrateGuestCartAPI.pending, (state) => { state.isLoading = true; })
      .addCase(hydrateGuestCartAPI.fulfilled, handleCartFulfilled)
      .addCase(hydrateGuestCartAPI.rejected, (state, action) => {
        state.isLoading = false;
        console.error("Hydration failed:", action.payload); 
      })

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
