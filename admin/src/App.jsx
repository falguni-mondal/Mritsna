import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PageRouter from './routes/PageRouter';
import { validateAdminSession } from './store/slices/authSlice';

const App = () => {
  const dispatch = useDispatch();
  
  // Pull the loading state directly from our Redux store
  const { isInitializing } = useSelector((state) => state.auth);

  useEffect(() => {
    // Fire the Redux thunk to validate httpOnly cookies the moment the app loads
    dispatch(validateAdminSession());
  }, [dispatch]);

  // Premium, Mritsna-branded initial loading screen
  if (isInitializing) {
    return (
      <main className="w-full h-[100dvh] bg-[#f8f8f8] flex items-center justify-center relative overflow-hidden">
        <div className="flex flex-col items-center gap-6">
          {/* Elegant minimalist spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border border-[#1a1a1a]/10 rounded-full" />
            <div className="absolute inset-0 border border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-[0.55rem] font-bold tracking-[0.4em] uppercase text-[#1a1a1a] opacity-60">
            Initializing Workspace
          </p>
        </div>
      </main>
    );
  }

  // Once Redux confirms the session check is complete (pass or fail), render the router
  return (
    <>
      <PageRouter />
    </>
  );
};

export default App;