import { TriangleMesh } from "../triangle_mesh";
import shader from "../shader/shaders.wgsl";
import {mat4} from "gl-matrix";

export class Renderer {

  canvas: HTMLCanvasElement;

  // Device/Context objects
  adapter!: GPUAdapter;
  device!: GPUDevice;
  context!: GPUCanvasContext;
  format!: GPUTextureFormat;

  // Triangle Mesh
  mesh!: TriangleMesh;

  // Render Pipeline
  uniformBuffer!: GPUBuffer;
  pipeline!: GPURenderPipeline;
  bindGroup!: GPUBindGroup;

  //Rotation
  t: number;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.t = 0.0;
  }

  async initialise() {
    await this.setupDevice();
    await this.createAssets();
    await this.createPipeline();
    this.render();
  }

  async setupDevice() {
    if (!navigator.gpu) {
      throw new Error("WebGPU not supported on this browser.");
    }
  
    this.adapter = <GPUAdapter> await navigator.gpu.requestAdapter();
    this.device  = <GPUDevice> await this.adapter.requestDevice();
  
    this.context = <GPUCanvasContext> this.canvas.getContext('webgpu') as GPUCanvasContext;
  
    const devicePixelRatio = window.devicePixelRatio || 1;
    this.canvas.width = this.canvas.clientWidth * devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * devicePixelRatio;
    this.format = navigator.gpu.getPreferredCanvasFormat();
  
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'opaque',
    });
  }

  async createAssets() {
    this.mesh = new TriangleMesh(this.device);
  }

  async createPipeline() {

    this.uniformBuffer = this.device.createBuffer({
      size: 64*3,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding:0, visibility: GPUShaderStage.VERTEX, buffer:{}}
      ],
    });
  
    this.bindGroup = this.device.createBindGroup({
      layout: bindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: this.uniformBuffer
          }
        }
      ]
    });
  
    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [bindGroupLayout]
    })
  
    this.pipeline = this.device.createRenderPipeline({
      label: "Cell pipeline",
      layout: pipelineLayout,
      vertex: {
        module: this.device.createShaderModule({
          code : shader
        }),
        entryPoint: "vs_main",
        buffers: [this.mesh.bufferLayout]
      },
      fragment: {
        module: this.device.createShaderModule({
          code : shader
        }),
        entryPoint: "fs_main",
        targets: [{
          format: this.format
        }]
      }, 
      primitive : {
        topology : "triangle-list"
      },
    });
  }

  render = () => {

    this.t += 0.01;

    if(this.t > 2.0 * Math.PI) {
      this.t -= 2.0 * Math.PI;
    }

    const projection = mat4.create();
    mat4.perspective(projection, Math.PI / 4, 800/600, 0.1, 10);

    const view = mat4.create();
    mat4.lookAt(view, [-2, 0, 2],[0, 0, 0], [0, 0, 1] ); // Understand this ?

    const model = mat4.create();
    mat4.rotate(model, model, this.t, [0, 0, 1]);

    this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>model);
    this.device.queue.writeBuffer(this.uniformBuffer, 64, <ArrayBuffer>view);
    this.device.queue.writeBuffer(this.uniformBuffer, 128, <ArrayBuffer>projection);

    const commandEncoder = this.device.createCommandEncoder();
    const textureView = this.context.getCurrentTexture().createView();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    };

    const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
    renderPass.setPipeline(this.pipeline);
    renderPass.setBindGroup(0, this.bindGroup);
    renderPass.setVertexBuffer(0,this.mesh.buffer);
    renderPass.draw(3, 1, 0, 0);
    renderPass.end()
    this.device.queue.submit([commandEncoder.finish()]);

    requestAnimationFrame(this.render);
  }
}