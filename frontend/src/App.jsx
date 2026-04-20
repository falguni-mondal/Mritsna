import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Navbar from './components/navbar/Navbar';
import PageRouter from './routes/PageRouter';
import PreFooterContact from './components/footer/PreFooterContact';
import Footer from './components/footer/Footer';
import CustomCursor from './components/global/CustomCursor';
import { checkAuth } from "./store/features/user/userSlice";

const App = () => {
  const dispatch = useDispatch();
  const { isCheckingAuth } = useSelector((state) => state.user);

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  if (isCheckingAuth) {
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