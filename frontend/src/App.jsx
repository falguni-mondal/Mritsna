import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from './components/navbar/Navbar';
import PageRouter from './routes/PageRouter';
import PreFooterContact from './components/footer/PreFooterContact';
import Footer from './components/footer/Footer';
import CustomCursor from './components/global/CustomCursor';

import { checkAuth } from "./store/features/authSlice";
import { fetchUserCart } from './store/features/cartSlice';
import { fetchUserWishlist } from './store/features/wishlistSlice';
import { fetchUserRegion } from './store/features/regionSlice'; // <-- Injecting the region thunk

const App = () => {
  const dispatch = useDispatch();
  
  // Pull states directly from Redux
  const { isCheckingAuth, isAuthenticated } = useSelector((state) => state.auth);
  
  // Pull region states
  const { data: regionData, isLoading: isRegionLoading } = useSelector((state) => state.region);
  
  // A local state to prevent UI jumping until the initial sequence is done
  const [isAppReady, setIsAppReady] = useState(false);

  // 1. Fire the Region Check on Mount
  // If localStorage already had the data, regionData exists and this safely skips the API call
  useEffect(() => {
    if (!regionData) {
      dispatch(fetchUserRegion());
    }
  }, [regionData, dispatch]);

  // 2. Fire the Auth Check on Mount
  useEffect(() => {
    dispatch(checkAuth()).finally(() => {
      // Once auth is checked (success or fail), we unlock the initial app render
      setIsAppReady(true); 
    });
  }, [dispatch]);

  // 3. Listen for Authentication Success to Fetch User Data
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserCart());
      dispatch(fetchUserWishlist());
    }
  }, [isAuthenticated, dispatch]);

  // 4. Global UI Blocker
  // We now block the UI if Auth is checking, the app isn't ready, OR if we are waiting on the IP Region API
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