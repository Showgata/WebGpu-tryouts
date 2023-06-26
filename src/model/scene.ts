import { Triangle } from "./triangle";
import { Camera } from "./camera";

export class Scene {
  _triangles: Triangle[];
  _player: Camera;

  constructor() {
    this._triangles = [];
    this._triangles.push(new Triangle([2, 0, 0], 0));

    this._player = new Camera([-2, 0, 0.5], 0, 0);
  }

  update() {
    this.triangles.forEach((triangle)=>{ triangle.update()});

    this.player.update();
  }

  get player(): Camera {
    return this._player;
  }

  get triangles(): Triangle[] {
    return this._triangles;
  }
}