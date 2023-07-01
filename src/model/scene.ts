import { Triangle } from "./triangle";
import { Camera } from "./camera";
import { vec3, mat4 } from "gl-matrix";

export class Scene {
  _triangles: Triangle[];
  _player: Camera;
  _object_data: Float32Array;
  _triangle_count: number;

  constructor() {
    this._triangles = [];
    
    this._player = new Camera([-2, 0, 0.5], 0, 0);

    this._object_data = new Float32Array(16 * 1024);
    this._triangle_count = 0;

    let i = 0;
    for (let y = -5; y < 5; y++) {
      this._triangles.push(new Triangle([2, y, 0], 0));

      let blankMatrix = mat4.create();

      for (let j = 0; j < 16; j++) {
        this._object_data[16 * i + j] = <number>blankMatrix.at(j);
      }
      i++;
      this._triangle_count++; 
    }
  }

  update() {
    let i = 0;
    this._triangles.forEach((triangle)=>{ 
      triangle.update()

      let model = triangle.model;
      for (let j = 0; j < 16; j++) {
        this._object_data[16 * i + j] = <number>model.at(j);
      }
      i++;
    });

    this.player.update();
  }

  get player(): Camera {
    return this._player;
  }

  get triangles(): Float32Array {
    return this._object_data;
  }

  spinCamera(dX: number, dY: number) {
    this._player._eulers[2] -= dX;
    this._player._eulers[2] %= 360;

    this._player._eulers[1] = Math.min(
      89, Math.max(
        -89,
        this._player._eulers[1] + dY
      )
    )
  }

  moveCamera(forwardAmount: number, rightAmount: number) {
    vec3.scaleAndAdd(
      this._player._position, this._player._position,
      this._player._forwards, forwardAmount
    )

    vec3.scaleAndAdd(
      this._player._position, this._player._position,
      this._player._right, rightAmount
    )
  }
}