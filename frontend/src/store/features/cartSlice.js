import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance'; // Adjust path to your configured Axios

// ==========================================
// LOCAL STORAGE HELPERS (GUEST CART)
// ==========================================
const loadGuestCart = () => {
  if (typeof window === 'undefined') return { items: [], subTotal: 0 };
  try {
    const saved = localStorage.getItem('guest_cart');
    return saved ? JSON.parse(saved) : { items: [], subTotal: 0 };
  } catch (error) {
    console.error("Failed to parse guest cart:", error);
    return { items: [], subTotal: 0 };
  }
};

const saveGuestCart = (items, subTotal) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('guest_cart', JSON.stringify({ items, subTotal }));
  }
};

const calculateSubTotal = (items) => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// ==========================================
// ASYNC THUNKS (API CALLS)
// ==========================================

// Lightweight Inventory Ping (Used by both Guests & Users before adding/updating)
export const verifyStock = createAsyncThunk(
  'cart/verifyStock',
  async ({ productId, variantId, requestedQuantity }, thunkAPI) => {
    try {
      const response = await userAxios.post('/cart/check-stock', {
        productId, variantId, requestedQuantity
      });
      return response.data.data; // { availableStock, isAvailable, message }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to verify stock';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Fetch Authenticated User Cart
export const fetchUserCart = createAsyncThunk(
  'cart/fetchUserCart',
  async (_, thunkAPI) => {
    try {
      const response = await userAxios.get('/cart');
      return response.data.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

// Add to DB Cart
export const addToCartDB = createAsyncThunk(
  'cart/addToCartDB',
  async (cartData, { dispatch, rejectWithValue }) => {
    try {
      // payload expects: { productId, variantId, quantity }
      await userAxios.post('/cart/add', cartData);
      // Immediately fetch the fresh cart to guarantee perfect sync with the DB
      dispatch(fetchUserCart()); 
      return true;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add item');
    }
  }
);

// Update DB Cart Quantity
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

// Remove Item from DB Cart
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

// Sync Guest Cart to DB (Call this immediately after a successful login)
export const syncGuestCartToDB = createAsyncThunk(
  'cart/syncGuestCartToDB',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const { items } = getState().cart; // Get the local guest items
      
      if (items.length > 0) {
        // Map the rich UI items down to the basic payload the backend expects
        const localItems = items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        }));

        await userAxios.post('/cart/sync', { localItems });
        
        dispatch({ type: 'cart/clearLocalCart' });
      }
      
      // Fetch the newly merged DB cart
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
const initialGuestCart = loadGuestCart();

const initialState = {
  items: initialGuestCart.items,
  subTotal: initialGuestCart.subTotal,
  isLoading: false,
  isError: false,
  message: '',
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // --- GUEST CART ACTIONS (LOCAL ONLY) ---
    
    addLocalItem: (state, action) => {
      const newItem = action.payload;
      const existingIndex = state.items.findIndex(item => item.variantId === newItem.variantId);

      if (existingIndex > -1) {
        const combinedQty = state.items[existingIndex].quantity + newItem.quantity;
        // Cap at the lesser of 5 or maxLimit (which is physical stock)
        state.items[existingIndex].quantity = Math.min(combinedQty, 5, newItem.maxLimit || 5);
        state.items[existingIndex].itemTotal = state.items[existingIndex].quantity * state.items[existingIndex].price;
      } else {
        // Ensure itemTotal exists for new items
        newItem.itemTotal = newItem.quantity * newItem.price;
        state.items.push(newItem);
      }

      state.subTotal = calculateSubTotal(state.items);
      saveGuestCart(state.items, state.subTotal);
    },

    updateLocalQuantity: (state, action) => {
      const { variantId, quantity } = action.payload;
      const existingItem = state.items.find(item => item.variantId === variantId);

      if (existingItem) {
        existingItem.quantity = quantity;
        existingItem.itemTotal = quantity * existingItem.price;
        state.subTotal = calculateSubTotal(state.items);
        saveGuestCart(state.items, state.subTotal);
      }
    },

    removeLocalItem: (state, action) => {
      const variantId = action.payload;
      state.items = state.items.filter(item => item.variantId !== variantId);
      state.subTotal = calculateSubTotal(state.items);
      saveGuestCart(state.items, state.subTotal);
    },

    clearLocalCart: (state) => {
      state.items = [];
      state.subTotal = 0;
      localStorage.removeItem('guest_cart');
    },

    clearCartErrors: (state) => {
      state.isError = false;
      state.message = '';
    }
  },
  
  extraReducers: (builder) => {
    builder
      // --- FETCH USER CART ---
      .addCase(fetchUserCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserCart.fulfilled, (state, action) => {
        state.isLoading = false;
        // The backend `getCart` controller returns perfectly formatted items and subTotal!
        state.items = action.payload.items;
        state.subTotal = action.payload.subTotal;
      })
      .addCase(fetchUserCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- ADD TO DB CART ---
      .addCase(addToCartDB.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
      })
      .addCase(addToCartDB.fulfilled, (state) => {
        // We don't manually mutate state here because the thunk dispatches `fetchUserCart()` 
        // upon success, which will cleanly overwrite the state with the exact DB truth.
        state.isLoading = false;
      })
      .addCase(addToCartDB.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // We can handle loading/error states similarly for Update and Remove, 
      // but to keep the UI snappy, we don't block the UI during these background syncs.
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