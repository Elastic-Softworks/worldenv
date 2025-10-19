/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         {{ShaderName}} Vertex Shader
           ---
           vertex shader template for WORLDENV rendering pipeline.

           this template provides a standard vertex shader structure
           with common vertex attributes, uniforms, and transformations
           following modern OpenGL/WebGL practices.

*/

#version 330 core

/*
	====================================================================
             --- VERTEX ATTRIBUTES ---
	====================================================================
*/

layout(location = 0) in vec3 aPosition; /* VERTEX POSITION */
layout(location = 1) in vec3 aNormal; /* VERTEX NORMAL */
layout(location = 2) in vec2 aTexCoord; /* TEXTURE COORDINATES */
layout(location = 3) in vec4 aColor; /* VERTEX COLOR */

/*
	====================================================================
             --- UNIFORMS ---
	====================================================================
*/

uniform mat4 uModel; /* MODEL TRANSFORMATION MATRIX */
uniform mat4 uView; /* VIEW TRANSFORMATION MATRIX */
uniform mat4 uProjection; /* PROJECTION TRANSFORMATION MATRIX */
uniform mat3 uNormalMatrix; /* NORMAL TRANSFORMATION MATRIX */

uniform float uTime; /* ELAPSED TIME FOR ANIMATIONS */
uniform vec2 uResolution; /* SCREEN RESOLUTION */

/*
	====================================================================
             --- OUTPUTS ---
	====================================================================
*/

out vec3 vWorldPos; /* WORLD SPACE POSITION */
out vec3 vNormal; /* TRANSFORMED NORMAL */
out vec2 vTexCoord; /* TEXTURE COORDINATES */
out vec4 vColor; /* VERTEX COLOR */
out vec3 vViewPos; /* VIEW SPACE POSITION */

/*
	====================================================================
             --- MAIN ---
	====================================================================
*/

/*

         main()
           ---
           vertex shader entry point.

           transforms vertex attributes from object space to
           screen space through model-view-projection pipeline.
           passes necessary data to fragment shader through
           varying outputs.

*/

void main() {

  /* transform position from object space to world space */
  vec4 worldPos = uModel * vec4(aPosition, 1.0);
  vWorldPos = worldPos.xyz;

  /* transform position from world space to view space */
  vec4 viewPos = uView * worldPos;
  vViewPos = viewPos.xyz;

  /* transform position from view space to clip space */
  gl_Position = uProjection * viewPos;

  /* transform normal to world space */
  vNormal = normalize(uNormalMatrix * aNormal);

  /* pass through texture coordinates */
  vTexCoord = aTexCoord;

  /* pass through vertex color */
  vColor = aColor;
}

/* end of {{ShaderName}} vertex shader */
