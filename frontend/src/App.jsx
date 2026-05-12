import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from './components/navbar/Navbar';
import PageRouter from './routes/PageRouter';
import PreFooterContact from './components/footer/PreFooterContact';
import Footer from './components/footer/Footer';
import CustomCursor from './components/global/CustomCursor';

import { checkAuth } from "./store/features/authSlice";
import { fetchUserCart } from './store/features/cartSlice';

const App = () => {
  const dispatch = useDispatch();
  
  // Pull states directly from Redux
  const { isCheckingAuth, isAuthenticated } = useSelector((state) => state.auth);
  
  // A local state to prevent UI jumping until the initial sequence is done
  const [isAppReady, setIsAppReady] = useState(false);

  // 1. Fire the Auth Check on Mount
  useEffect(() => {
    dispatch(checkAuth()).finally(() => {
      // Once auth is checked (success or fail), we unlock the initial app render
      setIsAppReady(true); 
    });
  }, [dispatch]);

  // 2. Listen for Authentication Success to Fetch the Cart
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserCart());
    }
  }, [isAuthenticated, dispatch]); // This runs automatically whenever `isAuthenticated` flips to true!

  // Block the UI if Auth is still checking, OR if the app hasn't finished its first cycle
  if (isCheckingAuth || !isAppReady) {
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