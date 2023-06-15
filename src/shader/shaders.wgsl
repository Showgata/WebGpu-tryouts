struct FragmentStruct {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>
};

@vertex
fn vs_main(@builtin(vertex_index) i_id: u32) -> FragmentStruct {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(0.0, 0.5),
    vec2<f32>(-0.5, -0.5),
    vec2<f32>(0.5, -0.5),
  );

  var colors = array<vec3<f32>, 3>(
    vec3<f32>(1.0, 0.0, 0.0),
    vec3<f32>(0.0, 1.0, 0.0),
    vec3<f32>(0.0, 0.0, 1.0),
  );

  var output: FragmentStruct;
  output.position = vec4<f32>(positions[i_id], 0.0, 1.0);
  output.color = vec4<f32>(colors[i_id], 1.0);

  return output;
}

@fragment
fn fs_main(@location(0) color: vec4<f32>) -> @location(0) vec4<f32> {
  return color;
}