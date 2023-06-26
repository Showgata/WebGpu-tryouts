import { useLayoutEffect, useRef } from 'react'
import './App.css'
import { MainControl } from './controller/main_control';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mainControllerRef = useRef<MainControl>();
  
  useLayoutEffect(() => {
    console.log(canvasRef); // { current: <canvasRef_object> }

    if(canvasRef.current && !mainControllerRef.current) {
      mainControllerRef.current = new MainControl(canvasRef.current);
      mainControllerRef.current.initialiseRenderer();
      mainControllerRef.current.run();
    }
  })
  
  return (
    <div className='root'>
      <canvas className='center' ref={canvasRef}></canvas>
    </div>
  )
}

export default App
