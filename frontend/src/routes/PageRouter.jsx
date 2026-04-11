import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Homepage from '../pages/Homepage'
import Shop from '../pages/Shop'

const PageRouter = () => {
  return (
    <Routes>
        <Route path='/' element={<Homepage />} />
        <Route path='/shop' element={<Shop />} />
    </Routes>
  )
}

export default PageRouter