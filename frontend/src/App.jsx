import React from 'react'
import Navbar from './components/navbar/Navbar'
import PageRouter from './routes/PageRouter'
import PreFooterContact from './components/footer/PreFooterContact'
import Footer from './components/footer/Footer'
import CustomCursor from './components/global/CustomCursor'

const App = () => {
  return (
    <div className='wrapper w-full'>
      {/* Global Cursor: Sits at the root, tracks everywhere */}
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

export default App