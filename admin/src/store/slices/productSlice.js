import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../configs/axiosInstance'; // Adjust path to your axiosInstance

const initialState = {
  products: [],          // For the Admin Table
  productDetails: null,  // For the Edit Form
  isLoading: false,
  isError: false,
  isSuccess: false,
  message: '',
};

// --- ASYNC THUNKS ---

// 1. Fetch All Products (Table Data)
export const fetchAdminProducts = createAsyncThunk(
  'products/fetchAll',
  async (_, thunkAPI) => {
    try {
      const response = await axiosInstance.get('/products');
      return response.data.data; // Our backend sends { success, count, data }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch products';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 2. Fetch Single Product (For Edit Form)
export const fetchProductById = createAsyncThunk(
  'products/fetchById',
  async (id, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/products/${id}`);
      return response.data.data; 
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch product details';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 3. Create New Product
export const createNewProduct = createAsyncThunk(
  'products/create',
  async (productData, thunkAPI) => {
    try {
      const response = await axiosInstance.post('/products', productData);
      return response.data; // Contains { success, message, data }
    } catch (error) {
      // Pass along the Zod validation errors if they exist
      const message = error.response?.data?.errors 
        ? error.response.data.errors // Array of Zod errors
        : error.response?.data?.message || error.message || 'Failed to create product';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 4. Update Existing Product
export const updateExistingProduct = createAsyncThunk(
  'products/update',
  async ({ id, updateData }, thunkAPI) => {
    try {
      const response = await axiosInstance.patch(`/products/${id}`, updateData);
      return response.data;
    } catch (error) {
      const message = error.response?.data?.errors 
        ? error.response.data.errors 
        : error.response?.data?.message || error.message || 'Failed to update product';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// 5. Change Product Status (Active, Draft, Archived)
export const changeStatus = createAsyncThunk(
  'products/changeStatus',
  async ({ id, status }, thunkAPI) => {
    try {
      const response = await axiosInstance.patch(`/products/${id}/status`, { status });
      return response.data.data; // Contains { id, status }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to change status';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// --- SLICE CONFIGURATION ---

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    // Utility to reset success/error states after a form submission or toast notification
    resetProductState: (state) => {
      state.isLoading = false;
      state.isError = false;
      state.isSuccess = false;
      state.message = '';
    },
    // Clear the edit form data when leaving the page
    clearProductDetails: (state) => {
      state.productDetails = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch All ---
      .addCase(fetchAdminProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAdminProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.products = action.payload;
      })
      .addCase(fetchAdminProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Single ---
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.productDetails = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Create ---
      .addCase(createNewProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createNewProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Optional: Instantly add the new product to the table without refetching
        state.products.unshift(action.payload.data); 
      })
      .addCase(createNewProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Update ---
      .addCase(updateExistingProduct.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateExistingProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.productDetails = action.payload.data;
      })
      .addCase(updateExistingProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Change Status ---
      .addCase(changeStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(changeStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        // Instantly update the status of the specific product in the table array
        const index = state.products.findIndex(p => p._id === action.payload.id);
        if (index !== -1) {
          state.products[index].status = action.payload.status;
        }
      })
      .addCase(changeStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { resetProductState, clearProductDetails } = productSlice.actions;
export default productSlice.reducer;