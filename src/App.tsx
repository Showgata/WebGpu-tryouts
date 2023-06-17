import { useLayoutEffect, useRef } from 'react'
import './App.css'
import { Renderer } from './renderer/renderer';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useLayoutEffect(() => {
    console.log(canvasRef); // { current: <canvasRef_object> }

    if(canvasRef.current) {
      const renderer = new Renderer(canvasRef.current);
      void renderer.initialise();
    }
  })
  
  return (
    <>
      <canvas className='center' ref={canvasRef}></canvas>
    </>
  )
}

export default App
