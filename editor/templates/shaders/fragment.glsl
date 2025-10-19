/*
 * SPDX-License-Identifier: ACSL-1.4 OR FAFOL-0.1 OR Hippocratic-3.0
 * Multi-licensed under ACSL-1.4, FAFOL-0.1, and Hippocratic-3.0
 * See LICENSE.txt for full license texts
 */

/*

         {{ShaderName}} Fragment Shader
           ---
           fragment shader template for WORLDENV rendering pipeline.

           this template provides a standard fragment shader structure
           with common lighting calculations, texture sampling, and
           material properties following modern OpenGL/WebGL practices.

*/

#version 330 core

/*
	====================================================================
             --- INPUTS ---
	====================================================================
*/

in vec3 vWorldPos; /* WORLD SPACE POSITION */
in vec3 vNormal; /* TRANSFORMED NORMAL */
in vec2 vTexCoord; /* TEXTURE COORDINATES */
in vec4 vColor; /* VERTEX COLOR */
in vec3 vViewPos; /* VIEW SPACE POSITION */

/*
	====================================================================
             --- UNIFORMS ---
	====================================================================
*/

/* material properties */
uniform sampler2D uDiffuseTexture; /* DIFFUSE/ALBEDO TEXTURE */
uniform sampler2D uNormalTexture; /* NORMAL MAP TEXTURE */
uniform sampler2D uSpecularTexture; /* SPECULAR/METALLIC TEXTURE */
uniform sampler2D uEmissionTexture; /* EMISSION TEXTURE */

uniform vec3 uDiffuseColor; /* BASE DIFFUSE COLOR */
uniform vec3 uSpecularColor; /* SPECULAR COLOR */
uniform vec3 uEmissionColor; /* EMISSION COLOR */
uniform float uShininess; /* SPECULAR SHININESS */
uniform float uOpacity; /* MATERIAL OPACITY */

/* lighting uniforms */
uniform vec3 uAmbientLight; /* AMBIENT LIGHTING COLOR */
uniform vec3 uDirectionalLight; /* DIRECTIONAL LIGHT DIRECTION */
uniform vec3 uDirectionalColor; /* DIRECTIONAL LIGHT COLOR */
uniform vec3 uCameraPosition; /* CAMERA WORLD POSITION */

/* scene uniforms */
uniform float uTime; /* ELAPSED TIME FOR ANIMATIONS */
uniform vec2 uResolution; /* SCREEN RESOLUTION */

/*
	====================================================================
             --- OUTPUTS ---
	====================================================================
*/

out vec4 FragColor; /* FINAL FRAGMENT COLOR */

/*
	====================================================================
             --- FUNCTIONS ---
	====================================================================
*/

/*

         calculateLighting()
           ---
           calculates basic phong lighting model.

           computes ambient, diffuse, and specular lighting
           components using the phong reflection model with
           directional light source.

*/

vec3 calculateLighting(vec3 normal, vec3 viewDir, vec3 lightDir) {

  /* normalize vectors */
  normal = normalize(normal);
  viewDir = normalize(viewDir);
  lightDir = normalize(-lightDir);

  /* ambient component */
  vec3 ambient = uAmbientLight;

  /* diffuse component */
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uDirectionalColor;

  /* specular component */
  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
  vec3 specular = spec * uSpecularColor * uDirectionalColor;

  return ambient + diffuse + specular;
}

/*

         sampleTextures()
           ---
           samples and combines material textures.

           reads diffuse, normal, specular, and emission textures
           and combines them according to material properties.

*/

vec4 sampleTextures() {

  /* sample diffuse texture */
  vec4 diffuseSample = texture(uDiffuseTexture, vTexCoord);
  vec3 diffuse = diffuseSample.rgb * uDiffuseColor;

  /* sample normal map (basic implementation) */
  vec3 normalSample = texture(uNormalTexture, vTexCoord).xyz;
  vec3 normal = normalize(vNormal); /* simplified - would use TBN matrix */

  /* sample specular texture */
  vec3 specularSample = texture(uSpecularTexture, vTexCoord).rgb;

  /* sample emission texture */
  vec3 emissionSample = texture(uEmissionTexture, vTexCoord).rgb;
  vec3 emission = emissionSample * uEmissionColor;

  /* calculate lighting */
  vec3 viewDir = uCameraPosition - vWorldPos;
  vec3 lighting = calculateLighting(normal, viewDir, uDirectionalLight);

  /* combine components */
  vec3 finalColor = diffuse * lighting + emission;
  float alpha = diffuseSample.a * uOpacity;

  return vec4(finalColor, alpha);
}

/*
	====================================================================
             --- MAIN ---
	====================================================================
*/

/*

         main()
           ---
           fragment shader entry point.

           computes final pixel color using material properties,
           lighting calculations, and texture sampling. applies
           vertex color modulation and outputs final fragment.

*/

void main() {

  /* sample and combine textures */
  vec4 materialColor = sampleTextures();

  /* apply vertex color modulation */
  materialColor *= vColor;

  /* output final fragment color */
  FragColor = materialColor;
}

/* end of {{ShaderName}} fragment shader */
