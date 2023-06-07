import {GRID_SIZE, getBuffer} from "./geom";

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

  const buffer = getBuffer(device);

  const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: "auto",
    vertex: {
      module: buffer.cellShaderModule,
      entryPoint: "vertexMain",
      buffers: [buffer.vertexBufferLayout]
    },
    fragment: {
      module: buffer.cellShaderModule,
      entryPoint: "fragmentMain",
      targets: [{
        format: presentationFormat
      }]
    }
  });

  const bindGroups = [
     device.createBindGroup({
      label: "Cell renderer bind group A",
      layout: cellPipeline.getBindGroupLayout(0),
      entries: [{
        binding: 0,
        resource: { buffer: buffer.uniformBuffer }
      }, {
        binding: 1,
        resource: { buffer: buffer.cellStateStorage[0] }
      }],
    }),
     device.createBindGroup({
      label: "Cell renderer bind group B",
      layout: cellPipeline.getBindGroupLayout(0),
      entries: [{
        binding: 0,
        resource: { buffer: buffer.uniformBuffer }
      }, {
        binding: 1,
        resource: { buffer: buffer.cellStateStorage[1] }
      }],
    })
  ];

  let step =0;
  function frame() {
    step++;
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
    passEncoder.setVertexBuffer(0, buffer.vertexBuffer);
    passEncoder.setBindGroup(0, bindGroups[step % 2]);
    passEncoder.draw(6, GRID_SIZE * GRID_SIZE); // 6 vertices
    passEncoder.end()
    device.queue.submit([commandEncoder.finish()]);
    // requestAnimationFrame(frame);
  }

  setInterval(frame, UPDATE_INTERVAL);

  // requestAnimationFrame(frame);
};