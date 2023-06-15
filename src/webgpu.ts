import shader from './shader/shaders.wgsl';

const UPDATE_INTERVAL = 1000;
export const init = async (canvas: any) => {
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported on this browser.");
  }

  const adapter = await navigator.gpu.requestAdapter();
  let device: GPUDevice;
  if(adapter)
    device = await adapter.requestDevice();
  else
    throw new Error("Graphics Adapter not found")

  const context = canvas.getContext('webgpu') as GPUCanvasContext;

  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  context.configure({
    device,
    format: presentationFormat,
    alphaMode: 'premultiplied',
  });

  const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: "auto",
    vertex: {
      module: device.createShaderModule({
        code : shader
      }),
      entryPoint: "vs_main",
    },
    fragment: {
      module: device.createShaderModule({
        code : shader
      }),
      entryPoint: "fs_main",
      targets: [{
        format: presentationFormat
      }]
    }, 
    primitive : {
      topology : "triangle-list"
    }
  });

  const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
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

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(cellPipeline);
    passEncoder.draw(3,1, 0, 0);
    passEncoder.end()
    device.queue.submit([commandEncoder.finish()]);
  }