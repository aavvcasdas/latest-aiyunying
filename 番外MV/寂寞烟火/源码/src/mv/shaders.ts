import * as THREE from 'three';

/**
 * Banded twilight-to-dawn sky dome shader matching the nostalgic pixel-storybook
 * dusk palette of the reference MV — pure procedural GLSL, zero background images.
 */
export function createTwilightSky() {
  const uniforms = {
    uZenith: { value: new THREE.Color('#242740') },
    uUpper: { value: new THREE.Color('#423f5c') },
    uLower: { value: new THREE.Color('#6c5e74') },
    uHorizon: { value: new THREE.Color('#9c878d') },
    uBandAmount: { value: 0.55 },
    uStarBoost: { value: 0.65 },
    uTime: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith;
      uniform vec3 uUpper;
      uniform vec3 uLower;
      uniform vec3 uHorizon;
      uniform float uBandAmount;
      uniform float uStarBoost;
      uniform float uTime;
      varying vec3 vDir;

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      void main() {
        float h = clamp(vDir.y * 1.15 + 0.08, 0.0, 1.0);
        // Subtle pixel-storybook stepped sky bands blended with smooth dusk gradient
        float bands = floor(h * 11.0) / 11.0;
        float hb = mix(h, bands, uBandAmount);

        vec3 col = mix(uHorizon, uLower, smoothstep(0.0, 0.28, hb));
        col = mix(col, uUpper, smoothstep(0.24, 0.62, hb));
        col = mix(col, uZenith, smoothstep(0.56, 0.98, hb));

        // Soft distant pixel-stepped horizon cloud strips
        float az = atan(vDir.x, -vDir.z);
        float cloudH = smoothstep(0.06, 0.12, h) * (1.0 - smoothstep(0.22, 0.36, h));
        float strip = sin(az * 5.0 + uTime * 0.04) * 0.5 + sin(az * 11.0 - uTime * 0.02) * 0.5;
        float cloudMask = step(0.45, strip) * cloudH * step(0.15, fract(h * 14.0));
        col = mix(col, mix(uLower, uHorizon, 0.6) * 0.88, cloudMask * 0.24);

        // Crisp twinkling stars in upper sky
        if (h > 0.14 && uStarBoost > 0.01) {
          vec2 grid = floor(vec2(az * 34.0, h * 58.0));
          vec2 local = fract(vec2(az * 34.0, h * 58.0)) - 0.5;
          float rnd = hash21(grid);
          if (rnd > 0.945) {
            float twinkle = 0.55 + 0.45 * sin(uTime * (2.0 + rnd * 4.0) + rnd * 62.0);
            // Tiny crisp square/cross pixel star
            float sq = step(max(abs(local.x), abs(local.y)), 0.14);
            float crossStar = (step(abs(local.x), 0.06) * step(abs(local.y), 0.28)
                             + step(abs(local.y), 0.06) * step(abs(local.x), 0.28));
            float starShape = rnd > 0.982 ? min(1.0, crossStar) : sq;
            vec3 starCol = mix(vec3(0.98, 0.94, 0.82), vec3(0.76, 0.91, 1.0), fract(rnd * 17.3));
            col += starCol * starShape * twinkle * uStarBoost * smoothstep(0.14, 0.38, h);
          }
        }

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const mesh = new THREE.Mesh(new THREE.SphereGeometry(140, 32, 24), mat);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

/**
 * Stylized twilight ocean shader with horizontal pixel-shimmer ripples
 * and warm amber lantern/moonlight reflection columns.
 */
export function createTwilightOcean() {
  const uniforms = {
    uDeep: { value: new THREE.Color('#2d435f') },
    uShallow: { value: new THREE.Color('#426282') },
    uHorizon: { value: new THREE.Color('#7f7588') },
    uGlint: { value: new THREE.Color('#c7e1ee') },
    uWarmReflect: { value: new THREE.Color('#f7d996') },
    uReflectCenter: { value: new THREE.Vector2(0.0, -14.0) },
    uWarmStrength: { value: 0.75 },
    uTime: { value: 0 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: false,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 pos = position;
        vec4 wp = modelMatrix * vec4(pos, 1.0);
        // Gentle stylized wave heave
        wp.y += sin(wp.x * 0.35 + uTime * 1.1) * 0.045 + cos(wp.z * 0.45 - uTime * 0.85) * 0.035;
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uHorizon;
      uniform vec3 uGlint;
      uniform vec3 uWarmReflect;
      uniform vec2 uReflectCenter;
      uniform float uWarmStrength;
      uniform float uTime;
      varying vec3 vWorldPos;
      varying vec2 vUv;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      void main() {
        // Distance-based water palette blending into horizon mist
        float dist = length(vWorldPos.xz - cameraPosition.xz);
        float depthFade = smoothstep(4.0, 52.0, dist);
        // Stepped ocean color bands
        float band = floor(depthFade * 6.0) / 6.0;
        vec3 col = mix(uShallow, uDeep, mix(depthFade, band, 0.45));

        // Crisp horizontal pixel-art wave dashes (matching reference MV water!)
        vec2 q = vec2(floor(vWorldPos.x * 1.15), floor(vWorldPos.z * 2.8));
        float drift = sin(vWorldPos.x * 0.7 + uTime * 1.3 + q.y * 1.7) * 0.5 + 0.5;
        float dash = step(0.84, hash(q + vec2(floor(uTime * 1.2 + q.y * 0.3), 0.0)) * 0.65 + drift * 0.42);
        float dashThin = step(0.58, fract(vWorldPos.z * 2.8));
        col = mix(col, uGlint, dash * dashThin * (1.0 - depthFade * 0.75) * 0.42);

        // Warm amber vertical shimmer column (lanterns / lighthouse / moon on water)
        float dx = abs(vWorldPos.x - uReflectCenter.x);
        float colWidth = 1.4 + 0.6 * sin(vWorldPos.z * 1.9 - uTime * 2.1);
        float warmCol = smoothstep(colWidth + 1.5, 0.2, dx);
        float warmStripes = step(0.45, sin(vWorldPos.z * 5.2 - uTime * 2.4 + sin(vWorldPos.x * 2.0)));
        col = mix(col, uWarmReflect, warmCol * warmStripes * uWarmStrength * (1.0 - depthFade * 0.6) * 0.72);

        // Soft distant horizon atmospheric haze
        float fogT = smoothstep(32.0, 96.0, dist);
        col = mix(col, uHorizon, fogT);

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });

  const geo = new THREE.PlaneGeometry(220, 220, 48, 48);
  geo.rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, uniforms };
}

/**
 * Glass-calm circular reflection pool for Zone E ("感谢你曾让我 / 留在你眼中")
 */
export function createMirrorPoolSurface() {
  const uniforms = {
    uTime: { value: 0 },
    uInner: { value: new THREE.Color('#3c5776') },
    uOuter: { value: new THREE.Color('#253750') },
    uGlow: { value: new THREE.Color('#f5d896') },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    vertexShader: /* glsl */ `
      varying vec2 vLocal;
      void main() {
        vLocal = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uInner;
      uniform vec3 uOuter;
      uniform vec3 uGlow;
      varying vec2 vLocal;
      void main() {
        float r = length(vLocal) / 4.45;
        vec3 col = mix(uInner, uOuter, smoothstep(0.1, 1.0, r));
        // Gentle concentric ripple rings
        float ring = smoothstep(0.88, 0.99, sin(r * 26.0 - uTime * 2.2) * 0.5 + 0.5);
        col = mix(col, uGlow, ring * 0.22 * (1.0 - r * 0.6));
        // Soft central moon-glow reflection
        col += uGlow * exp(-r * r * 3.2) * 0.16;
        gl_FragColor = vec4(col, 0.88);
      }
    `,
  });
  const geo = new THREE.CircleGeometry(4.45, 48);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.03;
  return { mesh, uniforms };
}

/**
 * Subtle cinematic vignette + gentle dawn/twilight flash post-processing shader.
 */
export const CinemaGradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uVignette: { value: 0.26 },
    uFlash: { value: 0.0 },
    uFlashColor: { value: new THREE.Color('#f5eed8') },
    uWarmth: { value: 0.04 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uVignette;
    uniform float uFlash;
    uniform vec3 uFlashColor;
    uniform float uWarmth;
    varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      // Subtle nostalgic film warmth
      c.r *= 1.0 + uWarmth;
      c.b *= 1.0 - uWarmth * 0.5;
      // Soft cinema vignette
      vec2 d = vUv - 0.5;
      float vig = 1.0 - dot(d, d) * uVignette * 2.4;
      c.rgb *= clamp(vig, 0.55, 1.0);
      // Transition / dawn cream fade
      c.rgb = mix(c.rgb, uFlashColor, clamp(uFlash, 0.0, 1.0));
      gl_FragColor = c;
    }
  `,
};
