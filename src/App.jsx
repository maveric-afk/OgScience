import { useState, useEffect, useRef } from "react";
import {RouterProvider,createBrowserRouter} from 'react-router-dom'
import Home from './pages/Home'
import Simulations from "./pages/Simulations";

const router=createBrowserRouter([
  {
    path:'/',
    element:<div>
      <Home/>
    </div>
  },
  {
    path:'/simulations',
    element:<div>
      <Simulations/>
    </div>
  }
])

export default function App() {

  return (
    <div>
      <RouterProvider router={router}>

      </RouterProvider>
    </div>
  );
}
