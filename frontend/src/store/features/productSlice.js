import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance'; 

export const fetchNewArrivals = createAsyncThunk(
  'product/fetchNewArrivals',
  async (_, thunkAPI) => {
    try {
      // userAxios automatically prepends the baseURL and includes credentials
      const response = await userAxios.get('/products/new-arrivals');
      return response.data.data;
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


const initialState = {
  newArrivals: [],
  products: [],
  pagination: {
    totalItems: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 12,
    hasNextPage: false,
    hasPrevPage: false
  },
  isLoading: false,
  isError: false,
  message: '',
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
        state.newArrivals = action.payload; 
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
      })
      .addCase(fetchStoreProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { clearProductErrors, clearProducts } = productSlice.actions;

export default productSlice.reducer;