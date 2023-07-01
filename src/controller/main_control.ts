import { Renderer } from "../view/renderer/renderer";
import { Scene } from "../model/scene";

export enum KeypressState {
  KEYUP = 0,
  KEYDOWN = 1
}

export class MainControl {
  _canvas: HTMLCanvasElement;
  _renderer: Renderer;
  _scene: Scene;
  
  _forwards_amount: number;
  _right_amount: number;


  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._renderer = new Renderer(canvas);
    this._scene = new Scene();

    this._forwards_amount = 0;
    this._right_amount = 0;
  }

  async initialiseRenderer() {
    await this._renderer.initialise();
  }

  run = () => {
    let running: boolean = true;

    this._scene.update();
    this._scene.moveCamera(this._forwards_amount, this._right_amount);
    this._renderer.render(
      this._scene.player,
      this._scene.triangles,
      this._scene._triangle_count
    );

    if(running) {
      requestAnimationFrame(this.run);
    }
  }

  handleKeypress(keyState: KeypressState,event: React.KeyboardEvent) {
    let dfValue: number = 0;
    if(keyState === KeypressState.KEYUP)
      dfValue = 0;
    else
      dfValue = 0.02;


    console.log("KeyPress - ", event.code);
    if(event.code === "KeyW") {
      this._forwards_amount = dfValue;
    }
    if(event.code === "KeyS") {
      this._forwards_amount = -dfValue;
    }
    if(event.code === "KeyA") {
      this._right_amount = -dfValue;
    }
    if(event.code === "KeyD") {
      this._right_amount = dfValue;
    }
  }

  handleMouseMove(event: React.MouseEvent) {
    
    this._scene.spinCamera(event.movementX / 5, event.movementY / 5); 

  }
}