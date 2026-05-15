import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance'; 

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

export const fetchUserCart = createAsyncThunk(
  'cart/fetchUserCart',
  async (_, thunkAPI) => {
    try {
      const response = await userAxios.get('/cart');
      // --- FIX 1: Return the full response data to ensure we grab the currency info ---
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
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

export const syncGuestCartToDB = createAsyncThunk(
  'cart/syncGuestCartToDB',
  async (_, { getState, dispatch, rejectWithValue }) => {
    try {
      const { items } = getState().cart; 
      
      if (items.length > 0) {
        const localItems = items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        }));

        await userAxios.post('/cart/sync', { localItems });
        dispatch({ type: 'cart/clearLocalCart' });
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
const initialGuestCart = loadGuestCart();

const initialState = {
  items: initialGuestCart.items,
  subTotal: initialGuestCart.subTotal,
  isLoading: false,
  isError: false,
  message: '',
  // --- FIX 2: Add default currency states ---
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
        state.items[existingIndex].quantity = Math.min(combinedQty, 5, newItem.maxLimit || 5);
        state.items[existingIndex].itemTotal = state.items[existingIndex].quantity * state.items[existingIndex].price;
      } else {
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
      .addCase(fetchUserCart.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserCart.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Ensure we safely extract data depending on how the backend nested it
        const payloadData = action.payload.data || action.payload;
        
        state.items = payloadData.items || [];
        state.subTotal = payloadData.subTotal || 0;
        
        // --- FIX 3: Save the currency info from the backend response ---
        state.currencySymbol = action.payload.currencySymbol || payloadData.currencySymbol || '₹';
        state.currencyCode = action.payload.currencyCode || payloadData.currencyCode || 'INR';
      })
      .addCase(fetchUserCart.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
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