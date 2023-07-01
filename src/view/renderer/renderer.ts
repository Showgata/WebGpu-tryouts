import { TriangleMesh } from "../triangle_mesh";
import shader from "../shader/shaders.wgsl";
import {mat4} from "gl-matrix";
import { Material } from "../material/material";
import { Camera } from "../../model/camera";

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
  objectBuffer!: GPUBuffer;
  pipeline!: GPURenderPipeline;
  bindGroup!: GPUBindGroup;

  //Depth Stencil logics
  depthStencilAttachment!: GPURenderPassDepthStencilAttachment;
  depthStencilBuffer!: GPUTexture;
  depthStencilView!: GPUTextureView;
  depthStencilState!: GPUDepthStencilState;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  async initialise() {
    await this.setupDevice();
    await this.createAssets();
    await this.makeDepthBufferResources();
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

    const modelBufferDescriptor: GPUBufferDescriptor = {
      size: 64 * 1024,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    }

    this.objectBuffer = this.device.createBuffer(modelBufferDescriptor);

    await this.material.initialise(this.device, "/me.jpg");
  }

  async makeDepthBufferResources() {
    
    this.depthStencilState = {
      format: "depth24plus-stencil8",
      depthWriteEnabled: true,
      depthCompare: "less-equal",
    };

    const size: GPUExtent3D = {
      width: this.canvas.width,
      height: this.canvas.height,
      depthOrArrayLayers: 1
    }

    const depthBufferDescriptor: GPUTextureDescriptor = {
      size: size,
      format: "depth24plus-stencil8",
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    }
    this.depthStencilBuffer = this.device.createTexture(depthBufferDescriptor);

    const depthViewBufferDescriptor: GPUTextureViewDescriptor = {
      format: "depth24plus-stencil8",
      dimension: "2d",
      aspect: "all"
    }
    this.depthStencilView = this.depthStencilBuffer.createView(depthViewBufferDescriptor);
    this.depthStencilAttachment = {
      view: this.depthStencilView,
      depthClearValue: 1,
      depthLoadOp: "clear",
      depthStoreOp: "store",
      stencilLoadOp: "clear",
      stencilStoreOp: "discard"
    }
  }

  async createPipeline() {

    this.uniformBuffer = this.device.createBuffer({
      size: 64 * 2, // only view and projection for now...model details has been moved to storage buffer
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    })

    const bindGroupLayout = this.device.createBindGroupLayout({
      entries: [
        {binding:0, visibility: GPUShaderStage.VERTEX, buffer:{}},
        {binding:1, visibility: GPUShaderStage.FRAGMENT, texture:{}}, // empty {} not neccessary, just good to see what the layout is being used for
        {binding:2, visibility: GPUShaderStage.FRAGMENT, sampler:{}},
        {binding:3, visibility: GPUShaderStage.VERTEX, buffer:{ type: "read-only-storage", hasDynamicOffset: false}} // storage buffer
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
        },
        {
          binding: 3,
          resource: {
            buffer: this.objectBuffer
          }
        },
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
      depthStencil: this.depthStencilState
    });
  }

  async render (camera: Camera, triangles: Float32Array, triangleCount: number) {

    if(this.device && this.uniformBuffer) {
      const projection = mat4.create();
      mat4.perspective(projection, Math.PI / 4, 800/600, 0.1, 10);

      const view = camera.view;
      this.device.queue.writeBuffer(this.objectBuffer, 0, <ArrayBuffer>triangles, 0, triangles.length);
      this.device.queue.writeBuffer(this.uniformBuffer, 0, <ArrayBuffer>view);
      this.device.queue.writeBuffer(this.uniformBuffer, 64, <ArrayBuffer>projection);

      const commandEncoder = this.device.createCommandEncoder();
      const textureView = this.context.getCurrentTexture().createView();
      const renderPassDescriptor: GPURenderPassDescriptor = {
        colorAttachments: [
          {
            view: textureView,
            clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
            loadOp: 'clear',
            storeOp: 'store',
          }],
          depthStencilAttachment: this.depthStencilAttachment
      };

      const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
      renderPass.setPipeline(this.pipeline);
      renderPass.setBindGroup(0, this.bindGroup);
      renderPass.setVertexBuffer(0,this.mesh.buffer);
      renderPass.draw(3, triangleCount, 0, 0);  
      renderPass.end()

      this.device.queue.submit([commandEncoder.finish()]);
    }
  }
}