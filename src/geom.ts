export const GRID_SIZE = 32;
export const getBuffer = (device: GPUDevice, vertices: Float32Array) => {
    const buffer = device.createBuffer({
      size: vertices.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true,
    });
  
    const mapping = new Float32Array(buffer.getMappedRange());
    mapping.set(vertices);
    buffer.unmap();
  
    return buffer;
}

const renderGrid = async (context: GPUCanvasContext, device: GPUDevice, vertexBuffer: GPUBuffer, vertexCount: number) 
=> {
  const vertexShaderCode = `
    [[stage(vertex)]]
    fn main([[location(0)]] position: vec3<f32>) -> [[builtin(position)]] vec4<f32> {
      return vec4<f32>(position, 1.0);
    }
  `;

  const fragmentShaderCode = `
    [[stage(fragment)]]
    fn main() -> [[location(0)]] vec4<f32> {
      return vec4<f32>(1.0, 1.0, 1.0, 1.0); // White color
    }
  `;

  const pipeline = device.createRenderPipeline({
    vertex: {
      module: device.createShaderModule({
        code: vertexShaderCode,
      }),
      entryPoint: 'main',
    },
    fragment: {
      module: device.createShaderModule({
        code: fragmentShaderCode,
      }),
      entryPoint: 'main',
      targets: [
        {
          format: context.getPreferredFormat(),
        },
      ],
    },
    primitive: {
      topology: 'line-list',
    },});

    
