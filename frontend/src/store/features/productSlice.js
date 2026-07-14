import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance'; 

export const fetchNewArrivals = createAsyncThunk(
  'product/fetchNewArrivals',
  async (_, thunkAPI) => {
    try {
      const response = await userAxios.get('/products/new-arrivals');
      return response.data; 
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch new arrivals';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchStoreProducts = createAsyncThunk(
  'product/fetchStoreProducts',
  async (queryParams = {}, thunkAPI) => {
    try {
      const response = await userAxios.get('/products', {
        params: queryParams
      });
      return response.data;
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch products';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const fetchSingleProduct = createAsyncThunk(
  'product/fetchSingleProduct',
  async (slug, thunkAPI) => {
    try {
      const response = await userAxios.get(`/products/${slug}`);
      return response.data.data; 
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch product details';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// --- NEW THUNK: Fetch Unique Categories ---
export const fetchUniqueCategories = createAsyncThunk(
  'product/fetchUniqueCategories',
  async (_, thunkAPI) => {
    try {
      // Must exactly match the route we just created in product.routes.js
      const response = await userAxios.get('/products/categories');
      return response.data.data; 
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch categories';
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const initialState = {
  newArrivals: [],
  products: [],
  singleProduct: null,
  
  // NEW: Store for dynamic categories
  categories: [], 
  
  pagination: {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 12,
    hasNextPage: false,
    hasPrevPage: false
  },
  isLoading: false,
  
  // NEW: Dedicated loading state for categories so it doesn't block the main products UI
  isCategoriesLoading: false, 
  
  isError: false,
  message: '',
  currencySymbol: '₹', 
  currencyCode: 'INR',
};

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    clearProductErrors: (state) => {
      state.isError = false;
      state.message = '';
    },
    clearProducts: (state) => {
      state.products = [];
      state.pagination = initialState.pagination;
    },
    clearSingleProduct: (state) => {
      state.singleProduct = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch New Arrivals ---
      .addCase(fetchNewArrivals.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(fetchNewArrivals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.newArrivals = action.payload.data; 
        state.currencySymbol = action.payload.currencySymbol || '₹';
        state.currencyCode = action.payload.currencyCode || 'INR';
      })
      .addCase(fetchNewArrivals.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Paginated Products ---
      .addCase(fetchStoreProducts.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
      })
      .addCase(fetchStoreProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.data; 
        state.pagination = action.payload.pagination; 
        state.currencySymbol = action.payload.currencySymbol || '₹';
        state.currencyCode = action.payload.currencyCode || 'INR';
      })
      .addCase(fetchStoreProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })

      // --- Fetch Single Product ---
      .addCase(fetchSingleProduct.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.message = '';
        state.singleProduct = null;
      })
      .addCase(fetchSingleProduct.fulfilled, (state, action) => {
        state.isLoading = false;
        state.singleProduct = action.payload; 
        state.currencySymbol = action.payload.currencySymbol || '₹';
        state.currencyCode = action.payload.currencyCode || 'INR';
      })
      .addCase(fetchSingleProduct.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // --- Fetch Unique Categories ---
      .addCase(fetchUniqueCategories.pending, (state) => {
        state.isCategoriesLoading = true;
      })
      .addCase(fetchUniqueCategories.fulfilled, (state, action) => {
        state.isCategoriesLoading = false;
        state.categories = action.payload; 
      })
      .addCase(fetchUniqueCategories.rejected, (state, action) => {
        state.isCategoriesLoading = false;
        // We log it instead of setting global isError to avoid throwing a 
        // full-page error block if just the filter dropdown fails to load.
        console.error("Category Fetch Error:", action.payload); 
      });
  },
});

export const { clearProductErrors, clearProducts, clearSingleProduct } = productSlice.actions;

export default productSlice.reducer;