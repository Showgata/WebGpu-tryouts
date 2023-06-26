import { Renderer } from "../view/renderer/renderer";
import { Scene } from "../model/scene";

export class MainControl {
  _canvas: HTMLCanvasElement;
  _renderer: Renderer;
  _scene: Scene;

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._renderer = new Renderer(canvas);
    this._scene = new Scene();
  }

  async initialiseRenderer() {
    await this._renderer.initialise();
  }

  run = () => {
    let running: boolean = true;

    this._scene.update();
    this._renderer.render(
      this._scene.player,
      this._scene.triangles
    );

    if(running) {
      requestAnimationFrame(this.run);
    }
  }
}