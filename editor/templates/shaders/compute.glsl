/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         {{ShaderName}} Compute Shader
           ---
           compute shader template for WORLDENV GPU computing pipeline.

           this template provides a standard compute shader structure
           for parallel GPU computations including data processing,
           physics simulations, and procedural generation tasks.

*/

#version 430

/*
	====================================================================
             --- WORK GROUP CONFIGURATION ---
	====================================================================
*/

layout(local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

/*
	====================================================================
             --- UNIFORMS ---
	====================================================================
*/

uniform float uTime; /* ELAPSED TIME FOR ANIMATIONS */
uniform float uDeltaTime; /* FRAME DELTA TIME */
uniform uvec3 uWorkGroupSize; /* COMPUTE WORK GROUP DIMENSIONS */
uniform uint uFrameCount; /* CURRENT FRAME NUMBER */

/*
	====================================================================
             --- STORAGE BUFFERS ---
	====================================================================
*/

/* input data buffer - read-only */
layout(std430, binding = 0) restrict readonly buffer InputBuffer {
  float inputData[];
};

/* output data buffer - write-only */
layout(std430, binding = 1) restrict writeonly buffer OutputBuffer {
  float outputData[];
};

/* shared data buffer - read-write */
layout(std430, binding = 2) restrict buffer SharedBuffer {
  float sharedData[];
};

/*
	====================================================================
             --- TEXTURES ---
	====================================================================
*/

layout(binding = 0, rgba32f) uniform image2D uInputTexture; /* INPUT TEXTURE */
layout(binding = 1, rgba32f) uniform image2D uOutputTexture; /* OUTPUT TEXTURE */

/*
	====================================================================
             --- SHARED MEMORY ---
	====================================================================
*/

shared float localWorkGroupData[16 * 16]; /* SHARED MEMORY FOR WORK GROUP */

/*
	====================================================================
             --- FUNCTIONS ---
	====================================================================
*/

/*

         getGlobalIndex()
           ---
           calculates global thread index from work group coordinates.

           computes the global index for the current invocation
           based on work group ID and local invocation ID.

*/

uint getGlobalIndex() {
  uvec3 globalID = gl_GlobalInvocationID;
  uvec3 workGroupSize = gl_WorkGroupSize;

  return globalID.z * (workGroupSize.x * workGroupSize.y) +
    globalID.y * workGroupSize.x +
    globalID.x;
}

/*

         getLocalIndex()
           ---
           calculates local thread index within work group.

           computes the local index for the current invocation
           within the current work group.

*/

uint getLocalIndex() {
  uvec3 localID = gl_LocalInvocationID;
  uvec3 workGroupSize = gl_WorkGroupSize;

  return localID.z * (workGroupSize.x * workGroupSize.y) +
    localID.y * workGroupSize.x +
    localID.x;
}

/*

         processData()
           ---
           main data processing function.

           performs the core computation for this compute shader.
           customize this function based on your specific use case.

*/

void processData(uint globalIndex, uint localIndex) {

  /* ensure we don't go out of bounds */
  if (globalIndex >= inputData.length()) {
    return;
  }

  /* read input data */
  float input = inputData[globalIndex];

  /* perform computation - example: simple mathematical operation */
  float result = sin(input + uTime) * cos(input * 2.0 + uDeltaTime);

  /* apply time-based animation */
  result += sin(uTime * 2.0 + float(globalIndex) * 0.1) * 0.1;

  /* write output data */
  outputData[globalIndex] = result;

  /* update shared data if needed */
  if (globalIndex < sharedData.length()) {
    sharedData[globalIndex] = result * 0.5;
  }
}

/*

         processTexture()
           ---
           texture processing function for image-based computations.

           performs texture-based operations using image load/store
           functions for GPU texture processing workflows.

*/

void processTexture() {
  ivec2 pixelCoord = ivec2(gl_GlobalInvocationID.xy);
  ivec2 imageSize = imageSize(uInputTexture);

  /* ensure we don't go out of bounds */
  if (pixelCoord.x >= imageSize.x || pixelCoord.y >= imageSize.y) {
    return;
  }

  /* read input pixel */
  vec4 inputPixel = imageLoad(uInputTexture, pixelCoord);

  /* perform image processing - example: color manipulation */
  vec4 outputPixel = inputPixel;

  /* apply time-based color shift */
  outputPixel.r = sin(inputPixel.r + uTime) * 0.5 + 0.5;
  outputPixel.g = cos(inputPixel.g + uTime * 1.5) * 0.5 + 0.5;
  outputPixel.b = sin(inputPixel.b + uTime * 0.5) * 0.5 + 0.5;

  /* apply pixel coordinate-based effects */
  vec2 normalizedCoord = vec2(pixelCoord) / vec2(imageSize);
  float distance = length(normalizedCoord - vec2(0.5));
  outputPixel.rgb *= (1.0 - distance * 0.5);

  /* write output pixel */
  imageStore(uOutputTexture, pixelCoord, outputPixel);
}

/*

         synchronizeWorkGroup()
           ---
           synchronizes work group threads using shared memory.

           demonstrates work group synchronization patterns
           for algorithms requiring thread coordination.

*/

void synchronizeWorkGroup() {
  uint localIndex = getLocalIndex();
  uint globalIndex = getGlobalIndex();

  /* write to shared memory */
  if (localIndex < 256 && globalIndex < inputData.length()) {
    localWorkGroupData[localIndex] = inputData[globalIndex];
  }

  /* synchronize work group threads */
  barrier();

  /* perform reduction or other collective operations */
  if (localIndex == 0) {
    float sum = 0.0;
    for (uint i = 0; i < min(256u, gl_WorkGroupSize.x * gl_WorkGroupSize.y); i++) {
      sum += localWorkGroupData[i];
    }

    /* store result for work group */
    uint workGroupIndex = gl_WorkGroupID.x +
        gl_WorkGroupID.y * gl_NumWorkGroups.x +
        gl_WorkGroupID.z * gl_NumWorkGroups.x * gl_NumWorkGroups.y;

    if (workGroupIndex < sharedData.length()) {
      sharedData[workGroupIndex] = sum;
    }
  }
}

/*
	====================================================================
             --- MAIN ---
	====================================================================
*/

/*

         main()
           ---
           compute shader entry point.

           orchestrates the main computation workflow including
           data processing, texture operations, and work group
           synchronization based on shader requirements.

*/

void main() {
  uint globalIndex = getGlobalIndex();
  uint localIndex = getLocalIndex();

  /* perform main data processing */
  processData(globalIndex, localIndex);

  /* perform texture processing if needed */
  processTexture();

  /* perform work group synchronization if needed */
  synchronizeWorkGroup();

  /* ensure all memory writes are completed */
  memoryBarrier();
}

/* end of {{ShaderName}} compute shader */
