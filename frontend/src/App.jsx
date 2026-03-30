import React from 'react'
import Navbar from './components/navbar/Navbar'
import PageRouter from './routes/PageRouter'

const App = () => {
  return (
    <div className='wrapper w-full'>
      <header className='w-full'>
        <Navbar />
      </header>
      <main className='w-full'>
        <PageRouter />
      </main>
    </div>
  )
}

export default App