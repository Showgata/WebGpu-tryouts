import { MouseEventHandler, useLayoutEffect, useRef } from 'react'
import './App.css'
import { KeypressState, MainControl } from './controller/main_control';

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

  const onMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();

    if(mainControllerRef.current) {
      mainControllerRef.current.handleMouseMove(e);
    }
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if(mainControllerRef.current) {
      mainControllerRef.current.handleKeypress(KeypressState.KEYDOWN, e);
    }
  }

  const onKeyUp = (e: React.KeyboardEvent) => {
    if(mainControllerRef.current) {
      mainControllerRef.current.handleKeypress(KeypressState.KEYUP, e);
    }
  }
  
  return (
    <div className='root'>
      <canvas tabIndex={1} className='center' ref={canvasRef} onMouseMove={onMouseMove} onKeyDown={onKeyDown} onKeyUp={onKeyUp}/>
    </div>
  )
}

export default App
