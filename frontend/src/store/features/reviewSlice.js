import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { userAxios } from '../../configs/axiosInstance';

// ==========================================
// ASYNC THUNKS
// ==========================================

/**
 * Fetch all approved reviews (plus the user's own pending review) for a product
 */
export const fetchProductReviews = createAsyncThunk(
  'reviews/fetchProductReviews',
  async (slug, { rejectWithValue }) => {
    try {
      const response = await userAxios.get(`/reviews/product/${slug}`);
      return response.data.data; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch reviews'
      );
    }
  }
);

/**
 * Check if the current user/device is allowed to leave a review
 */
export const checkReviewEligibility = createAsyncThunk(
  'reviews/checkEligibility',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await userAxios.get(`/reviews/eligibility/${productId}`);
      return response.data; 
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to check eligibility'
      );
    }
  }
);

/**
 * Submit a new product review
 */
export const submitReview = createAsyncThunk(
  'reviews/submitReview',
  async (reviewData, { rejectWithValue }) => {
    try {
      const response = await userAxios.post('/reviews', reviewData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to submit review'
      );
    }
  }
);


// ==========================================
// REDUX SLICE
// ==========================================

const initialState = {
  // Public Data
  reviews: [],
  
  // Eligibility State
  eligibilityStatus: 'IDLE',
  eligibilityData: null,
  
  // Granular Loading States for UI Polish
  isFetchingReviews: false,
  isCheckingEligibility: false,
  isSubmittingReview: false,
  
  // Granular Error States
  fetchError: null,
  eligibilityError: null,
  submitError: null,
  
  // Form Feedback
  submitSuccess: false,
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    // Resets form and eligibility state when unmounting or navigating away
    resetReviewState: (state) => {
      state.eligibilityStatus = 'IDLE';
      state.eligibilityData = null;
      state.submitError = null;
      state.submitSuccess = false;
    },
    clearReviewErrors: (state) => {
      state.fetchError = null;
      state.eligibilityError = null;
      state.submitError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Reviews ---
      .addCase(fetchProductReviews.pending, (state) => {
        state.isFetchingReviews = true;
        state.fetchError = null;
      })
      .addCase(fetchProductReviews.fulfilled, (state, action) => {
        state.isFetchingReviews = false;
        state.reviews = action.payload;
      })
      .addCase(fetchProductReviews.rejected, (state, action) => {
        state.isFetchingReviews = false;
        state.fetchError = action.payload;
      })

      // --- Check Eligibility ---
      .addCase(checkReviewEligibility.pending, (state) => {
        state.isCheckingEligibility = true;
        state.eligibilityError = null;
        state.eligibilityStatus = 'LOADING';
      })
      .addCase(checkReviewEligibility.fulfilled, (state, action) => {
        state.isCheckingEligibility = false;
        state.eligibilityStatus = action.payload.eligibility;
        
        // Strip out the success/eligibility flags and store the exact data needed for the form
        const { success, eligibility, ...restData } = action.payload;
        state.eligibilityData = restData;
      })
      .addCase(checkReviewEligibility.rejected, (state, action) => {
        state.isCheckingEligibility = false;
        state.eligibilityError = action.payload;
        state.eligibilityStatus = 'IDLE';
      })

      // --- Submit Review ---
      .addCase(submitReview.pending, (state) => {
        state.isSubmittingReview = true;
        state.submitError = null;
        state.submitSuccess = false;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.isSubmittingReview = false;
        state.submitSuccess = true;
        state.eligibilityStatus = 'ALREADY_REVIEWED'; // Immediately lock the form from further submissions
        
        // Optimistic UI: Inject the newly submitted pending review directly to the top of the UI list
        if (action.payload.review) {
          const newReview = action.payload.review;
          
          // Format it to match the unified output structure from getProductReviews
          const formattedReview = {
            _id: newReview._id,
            rating: newReview.rating,
            comment: newReview.comment,
            colorName: newReview.colorName,
            images: newReview.images,
            createdAt: newReview.createdAt,
            status: newReview.status, // Will be 'pending'
            author: state.eligibilityData?.guestName || 'You', // Intelligent fallback for UI update
            isVerifiedBuyer: true
          };
          
          state.reviews.unshift(formattedReview);
        }
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.isSubmittingReview = false;
        state.submitError = action.payload;
        state.submitSuccess = false;
      });
  }
});

export const { resetReviewState, clearReviewErrors } = reviewSlice.actions;

export default reviewSlice.reducer;