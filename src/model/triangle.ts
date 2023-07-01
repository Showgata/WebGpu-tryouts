import { vec3, mat4 } from "gl-matrix";
import { Deg2Rad } from "./math_stuff";

export class Triangle {

  _position: vec3;
  _eulers: vec3;
  _model!: mat4;

  constructor(position: vec3, theta:number) {
    this._position = position;
    this._eulers = vec3. create();
    this._eulers[2] = theta;
  }

  update() {
    this._eulers[2] += 1;
    this._eulers[2] %= 360;

    this._model = mat4.create();
    mat4.translate(this._model, this.model, this._position);
    mat4.rotateZ(this._model, this.model, Deg2Rad(this._eulers[2]));
  }

  get model(): mat4 {
    return this._model;
  }

}