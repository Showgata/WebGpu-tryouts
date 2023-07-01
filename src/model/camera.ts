import { vec3, mat4 } from "gl-matrix";
import { Deg2Rad } from "./math_stuff";

export class Camera {

  _position: vec3;
  _eulers: vec3;
  _view!: mat4;

  //fundamental vectors of the camera
  _forwards: vec3;
  _right: vec3;
  _up: vec3;


  constructor(position: vec3, theta:number, phi: number) {
    this._position = position;
    this._eulers = [0, phi, theta];
  
    this._forwards = vec3.create();
    this._right = vec3.create();
    this._up = vec3.create();
  }

  update() {
    //Each fundamental vectors of the camera
    this._forwards = [
      Math.cos(Deg2Rad(this._eulers[2])) * Math.cos(Deg2Rad(this._eulers[1])),
      Math.sin(Deg2Rad(this._eulers[2])) * Math.cos(Deg2Rad(this._eulers[1])),
      Math.sin(Deg2Rad(this._eulers[1]))
    ]

    vec3.cross(this._right, this._forwards, [0, 0, 1]);
    vec3.cross(this._up, this._right , this._forwards); 

    //Look At matrix
    let target: vec3 = vec3.create();
    vec3.add(target, this._position, this._forwards);
    this._view = mat4.create();
    mat4.lookAt(this._view, this._position, target, this._up);
  }

  get view(): mat4 {
    return this._view;
  }

}