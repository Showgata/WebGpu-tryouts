import { useLayoutEffect, useRef } from 'react'
import './App.css'
import {init} from './webgpu'

function App() {
  const canvasRef = useRef(null);
  
  useLayoutEffect(() => {
    console.log(canvasRef); // { current: <canvasRef_object> }
    init(canvasRef.current);
  })


  return (
    <>
      <canvas className='center' ref={canvasRef}></canvas>
    </>
  )
}

export default App
