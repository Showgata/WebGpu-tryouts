import { TriangleMesh } from "../triangle_mesh";
import shader from "../shader/shaders.wgsl";
import {mat4} from "gl-matrix";
import { Material } from "../material/material";
import { Camera } from "../../model/camera";
import { Triangle } from "../../model/triangle";

export class Renderer {

  canvas: HTMLCanvasElement;

  // Device/Context objects
  adapter!: GPUAdapter;
  device!: GPUDevice;
  context!: GPUCanvasContext;
  format!: GPUTextureFormat;

  // Triangle Mesh
  mesh!: TriangleMesh;
  material!: Material;

  // Render Pipeline
  uniformBuffer!: GPUBuffer;
  pipeline!: GPURenderPipeline;
  bindGroup!: GPUBindGroup;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async initialise() {
    await this.setupDevice();
    await this.createAssets();
    await this.createPipeline();
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
    this.format = "rgba8unorm";
  
    this.context.configure({
      device: this.device,
      format: this.format,
      alphaMode: 'opaque',
    });
  }

  async createAssets() {
    this.mesh = new TriangleMesh(this.device);
    this.material = new Material();

    await this.material.initialise(this.device, "/me.jpg");
  }

  async createPipeline() {

    this.uniformBuffer = this.device.createBuffer({
      size: 64*3,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding:0, visibility: GPUShaderStage.VERTEX, buffer:{}},
        {binding:1, visibility: GPUShaderStage.FRAGMENT, texture:{}}, // empty {} not neccessary, just good to see what the layout is being used for
        {binding:2, visibility: GPUShaderStage.FRAGMENT, sampler:{}}
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
        },
        {
          binding: 1,
          resource: this.material.view
        },
        {
          binding: 2,
          resource: this.material.sampler
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

  async render (camera: Camera, triangles: Triangle[]) {

    if(this.device) {
      const projection = mat4.create();
      mat4.perspective(projection, Math.PI / 4, 800/600, 0.1, 10);

      const view = camera.view;
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


      triangles.forEach((triangle) => {
        const model = triangle.model;
        this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>model);
        renderPass.setBindGroup(0, this.bindGroup);
        renderPass.setVertexBuffer(0,this.mesh.buffer);
        renderPass.draw(3, 1, 0, 0);

      });
      renderPass.end()
      this.device.queue.submit([commandEncoder.finish()]);
    }
  }
}