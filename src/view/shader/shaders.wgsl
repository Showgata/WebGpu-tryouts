struct ObjectData {
    model: array<mat4x4<f32>>,
}

struct TransformData {
  view: mat4x4<f32>,
  projection: mat4x4<f32>
};

@binding(0) @group(0) var<uniform> transformUBO: TransformData;
@binding(1) @group(0) var myTexture: texture_2d<f32>;
@binding(2) @group(0) var mySampler: sampler;
@binding(3) @group(0) var<storage, read> objects: ObjectData;

struct FragmentStruct {
  @builtin(position) position : vec4<f32>,
  @location(0) texCoord : vec2<f32> // u v
};

@vertex
fn vs_main(@builtin(instance_index) id: u32, @location(0) vertexPosition: vec3<f32>, @location(1) vertexTextureCoord: vec2<f32>) -> FragmentStruct {
  var output: FragmentStruct;
  /*<---------------------------------------<----------<<<---------<---------<<<--------<-------------<<<----------*/
  output.position = transformUBO.projection * transformUBO.view * objects.model[id] * vec4<f32>(vertexPosition, 1.0);
  output.texCoord = vertexTextureCoord;

  return output;
}

@fragment
fn fs_main(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
  return textureSample(myTexture, mySampler, texCoord);
}