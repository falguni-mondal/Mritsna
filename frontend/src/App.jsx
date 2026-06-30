import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from './components/navbar/Navbar';
import PageRouter from './routes/PageRouter';
import PreFooterContact from './components/footer/PreFooterContact';
import Footer from './components/footer/Footer';
import CustomCursor from './components/global/CustomCursor';

import { checkAuth } from "./store/features/authSlice";
import { fetchUserCart, hydrateGuestCartAPI } from './store/features/cartSlice';
// --- FIX: Import the guest wishlist hydration thunk ---
import { fetchUserWishlist, hydrateGuestWishlistAPI } from './store/features/wishlistSlice';
import { fetchUserRegion } from './store/features/regionSlice'; 

const App = () => {
  const dispatch = useDispatch();
  
  const { isCheckingAuth, isAuthenticated } = useSelector((state) => state.auth);
  
  const { data: regionData, isLoading: isRegionLoading } = useSelector((state) => state.region);
  
  const [isAppReady, setIsAppReady] = useState(false);

  // 1. Fire the Region Check on Mount
  useEffect(() => {
    if (!regionData) {
      dispatch(fetchUserRegion());
    }
  }, [regionData, dispatch]);

  // 2. Fire the Auth Check on Mount
  useEffect(() => {
    dispatch(checkAuth()).finally(() => {
      setIsAppReady(true); 
    });
  }, [dispatch]);

  // 3. THE MAGIC LOOP: Fetching the right data at the right time
  useEffect(() => {
    if (isAppReady) {
      if (isAuthenticated) {
        // Logged In: Fetch from MongoDB, backend handles pricing
        dispatch(fetchUserCart());
        dispatch(fetchUserWishlist());
      } else {
        // Guest: Send the dumb IDs to the backend to get live regional prices
        dispatch(hydrateGuestCartAPI());
        dispatch(hydrateGuestWishlistAPI()); // <-- THE FINAL PIECE
      }
    }
  }, [isAuthenticated, isAppReady, dispatch]);

  // 4. Global UI Blocker
  if (isCheckingAuth || !isAppReady || isRegionLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#f8f8f8]">
        <div className="text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-50 animate-pulse">
          Loading Mritsna...
        </div>
      </div>
    );
  }

  return (
    <div className='wrapper w-full'>
      <CustomCursor />
      
      <header className='w-full'>
        <Navbar />
      </header>
      
      <main className='w-full'>
        <PageRouter />
        <PreFooterContact />
      </main>
      
      <Footer />
    </div>
  )
}

export default App;