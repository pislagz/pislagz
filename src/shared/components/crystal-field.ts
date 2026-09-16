import * as THREE from "three";
import { CRYSTAL_PALETTES, type CrystalPalette, type CrystalRgb } from "./crystal-palettes";

type FieldHandle = {
  destroy: () => void;
  setReducedMotion: (value: boolean) => void;
  setPalette: (palette: CrystalPalette) => void;
  setEpicenterOffset: (offset: { x: number; y: number }) => void;
  setEpicenterScale: (scale: number) => void;
};

type Options = {
  reducedMotion: boolean;
  palette?: CrystalPalette;
  onReady?: () => void;
};

const VERT = /* glsl */ `
attribute vec3 aCentroid;
uniform float uTime;
uniform float uMotion;
uniform float uRipple;
uniform float uWeight;
uniform vec2 uMouse;
uniform float uGain;
uniform float uSpin;
uniform float uRipple2;
uniform vec3 uPhase;
varying float vRipple;
varying vec2 vUv;
varying vec3 vViewPos;

void main() {
  vUv = uv;
  float t = uTime * uMotion;
  float dist = length(uv - 0.5);
  float ripple = sin(dist * uRipple - t * 1.15 + uPhase.x);
  float ripple2 = sin(dist * uRipple2 + t * 0.7 + uPhase.y);

  vec3 pos = position;
  pos.z += ripple * 1.15;
  pos.z -= ripple2 * 0.45;
  pos.z += sin(aCentroid.x * 0.8 + aCentroid.y * 0.6 + t * 0.5 + uPhase.z) * 0.22;

  vec3 dir = normalize(position - aCentroid + vec3(0.0001));
  float pinch = sin(aCentroid.x * 2.1 + aCentroid.y * 1.7 + t + uPhase.z) * 0.5 + 0.5;
  pos -= dir * uWeight * (0.55 + pinch * 0.45);

  float ang = t * uSpin;
  float ca = cos(ang);
  float sa = sin(ang);
  pos.xy = mat2(ca, -sa, sa, ca) * pos.xy;

  pos.z -= exp(-length(pos.xy - vec2(uMouse.x, uMouse.y) * 7.0) * 0.5) * 0.85;

  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vViewPos = mv.xyz;
  vRipple = ripple * 0.5 + 0.5;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAG = /* glsl */ `
uniform float uGain;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
varying float vRipple;
varying vec2 vUv;
varying vec3 vViewPos;

void main() {
  vec3 n = normalize(cross(dFdx(vViewPos), dFdy(vViewPos)));
  float fresnel = pow(1.0 - abs(n.z), 2.0);
  float facing = abs(n.z);

  vec3 color = mix(uColorA, uColorB, vRipple);
  color = mix(color, uColorC, fresnel);
  color *= 0.45 + facing * 1.1;
  color += fresnel * 0.65;

  float hole = mix(0.12, 1.0, smoothstep(0.06, 0.24, length(vUv - 0.5)));
  gl_FragColor = vec4(color * 0.85 * uGain, hole * (0.12 + fresnel * 0.35));
}
`;

function createCrystalGeometry(size: number, subdiv: number) {
  const plane = new THREE.PlaneGeometry(size, size, subdiv, subdiv);
  const src = plane.getAttribute("position") as THREE.BufferAttribute;
  const uvAttr = plane.getAttribute("uv") as THREE.BufferAttribute;
  const index = plane.getIndex();
  if (!index) {
    plane.dispose();
    throw new Error("Crystal plane is missing an index");
  }

  const pos: number[] = [];
  const cen: number[] = [];
  const uv: number[] = [];

  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i);
    const b = index.getX(i + 1);
    const c = index.getX(i + 2);
    const ax = src.getX(a);
    const ay = src.getY(a);
    const az = src.getZ(a);
    const bx = src.getX(b);
    const by = src.getY(b);
    const bz = src.getZ(b);
    const cx = src.getX(c);
    const cy = src.getY(c);
    const cz = src.getZ(c);
    const mx = (ax + bx + cx) / 3;
    const my = (ay + by + cy) / 3;
    const mz = (az + bz + cz) / 3;
    pos.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    cen.push(mx, my, mz, mx, my, mz, mx, my, mz);
    uv.push(uvAttr.getX(a), uvAttr.getY(a), uvAttr.getX(b), uvAttr.getY(b), uvAttr.getX(c), uvAttr.getY(c));
  }

  plane.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute("aCentroid", new THREE.Float32BufferAttribute(cen, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return geometry;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function vec3FromRgb(rgb: CrystalRgb) {
  return new THREE.Vector3(rgb[0], rgb[1], rgb[2]);
}

function makeMaterial(
  ripple: number,
  weight: number,
  spin: number,
  ripple2: number,
  phase: THREE.Vector3,
  palette: CrystalPalette,
) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uRipple: { value: ripple },
      uRipple2: { value: ripple2 },
      uWeight: { value: weight },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uGain: { value: 1 },
      uSpin: { value: spin },
      uPhase: { value: phase },
      uColorA: { value: vec3FromRgb(palette.a) },
      uColorB: { value: vec3FromRgb(palette.b) },
      uColorC: { value: vec3FromRgb(palette.c) },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
}

function isTouchPrimary() {
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

function gainForViewport() {
  // Mobile needs higher shader gain; narrow desktop windows should stay dim.
  return isTouchPrimary() ? 0.45 : 0.16;
}

export function createCrystalField(canvas: HTMLCanvasElement, options: Options): FieldHandle {
  const initialPalette = options.palette ?? CRYSTAL_PALETTES.home;
  const mobile = isTouchPrimary();
  const dprCap = mobile ? 1.25 : 1.5;
  const subdiv = mobile ? 64 : 110;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: false,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
  });
  renderer.setClearColor(0x070910, 1);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.debug.onShaderError = (gl, _program, vs, fs) => {
    const err = {
      vs: gl.getShaderInfoLog(vs),
      fs: gl.getShaderInfoLog(fs),
    };
    console.error("Crystal shader error", err);
    (window as Window & { __shaderErr?: unknown }).__shaderErr = err;
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 80);
  camera.position.set(0, 0, 9);

  const spin = (Math.random() < 0.5 ? -1 : 1) * rand(0.045, 0.085);
  const baseShiftX = rand(2.2, 3.4);
  const baseShiftY = rand(-0.7, 0.7);
  const layerBTimeScale = rand(0.68, 0.95);
  const layerBTimeOffset = rand(0.4, 4.8);
  const randomPhase = () => new THREE.Vector3(rand(0, Math.PI * 2), rand(0, Math.PI * 2), rand(0, Math.PI * 2));

  const geometry = createCrystalGeometry(18, subdiv);
  const layerA = new THREE.Mesh(
    geometry,
    makeMaterial(rand(13, 20), rand(0.48, 0.56), spin, rand(20, 28), randomPhase(), initialPalette),
  );
  const layerB = new THREE.Mesh(
    geometry,
    makeMaterial(rand(28, 40), rand(0.44, 0.52), spin * rand(0.7, 1.15), rand(18, 30), randomPhase(), initialPalette),
  );
  layerA.position.set(baseShiftX, baseShiftY, 0);
  layerB.position.set(baseShiftX, baseShiftY, 0);
  layerA.rotation.z = rand(-0.12, 0.12);
  layerB.rotation.z = rand(-0.35, 0.35);
  scene.add(layerA, layerB);

  let reducedMotion = options.reducedMotion;
  let raf = 0;
  let running = true;
  let time = rand(0, 240);
  let last = performance.now();
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const colorA = vec3FromRgb(initialPalette.a);
  const colorB = vec3FromRgb(initialPalette.b);
  const colorC = vec3FromRgb(initialPalette.c);
  const targetA = colorA.clone();
  const targetB = colorB.clone();
  const targetC = colorC.clone();
  let renderWidth = 0;
  let renderHeight = 0;
  let renderPixelRatio = 0;
  let announcedReady = false;
  let epicenterOffset = { x: 0, y: 0 };
  let epicenterScale = 1;

  const applyEpicenter = () => {
    const height = renderHeight || canvas.clientHeight || window.innerHeight;
    const visibleHeight = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 180 / 2);
    const worldPerPixel = visibleHeight / Math.max(height, 1);
    const x = baseShiftX + epicenterOffset.x * worldPerPixel;
    const y = baseShiftY - epicenterOffset.y * worldPerPixel;
    layerA.position.set(x, y, 0);
    layerB.position.set(x, y, 0);
    layerA.scale.set(epicenterScale, epicenterScale, epicenterScale);
    layerB.scale.set(epicenterScale, epicenterScale, epicenterScale);
  };

  const applyColors = () => {
    const matA = layerA.material as THREE.ShaderMaterial;
    const matB = layerB.material as THREE.ShaderMaterial;
    matA.uniforms.uColorA.value.copy(colorA);
    matA.uniforms.uColorB.value.copy(colorB);
    matA.uniforms.uColorC.value.copy(colorC);
    matB.uniforms.uColorA.value.copy(colorA);
    matB.uniforms.uColorB.value.copy(colorB);
    matB.uniforms.uColorC.value.copy(colorC);
  };

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (width < 1 || height < 1) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, dprCap);

    // Safari emits a final resize when its collapsing toolbar settles. Avoid
    // reallocating the WebGL drawing buffer when our lvh-sized canvas did not
    // actually change.
    if (
      width === renderWidth &&
      height === renderHeight &&
      pixelRatio === renderPixelRatio
    ) {
      return;
    }

    renderWidth = width;
    renderHeight = height;
    renderPixelRatio = pixelRatio;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const gain = gainForViewport();
    (layerA.material as THREE.ShaderMaterial).uniforms.uGain.value = gain;
    (layerB.material as THREE.ShaderMaterial).uniforms.uGain.value = gain;
    applyEpicenter();
  };

  const onPointer = (event: PointerEvent) => {
    mouse.tx = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.ty = -((event.clientY / window.innerHeight) * 2 - 1);
  };

  const onVisibility = () => {
    if (document.hidden) {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      return;
    }
    last = performance.now();
    if (!raf && running) raf = requestAnimationFrame(frame);
  };

  const frame = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reducedMotion) time += dt;
    const ease = reducedMotion ? 1 : 0.05;
    mouse.x += (mouse.tx - mouse.x) * ease;
    mouse.y += (mouse.ty - mouse.y) * ease;

    const mix = reducedMotion ? 1 : 1 - Math.exp(-dt * 4.2);
    colorA.lerp(targetA, mix);
    colorB.lerp(targetB, mix);
    colorC.lerp(targetC, mix);
    applyColors();

    const matA = layerA.material as THREE.ShaderMaterial;
    const matB = layerB.material as THREE.ShaderMaterial;
    matA.uniforms.uTime.value = time;
    matB.uniforms.uTime.value = time * layerBTimeScale + layerBTimeOffset;
    matA.uniforms.uMotion.value = reducedMotion ? 0 : 1;
    matB.uniforms.uMotion.value = reducedMotion ? 0 : 1;
    matA.uniforms.uMouse.value.set(mouse.x, mouse.y);
    matB.uniforms.uMouse.value.set(mouse.x, mouse.y);

    camera.position.x += (mouse.x * 0.9 - camera.position.x) * 0.05;
    camera.position.y += (mouse.y * 0.55 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
    if (!announcedReady) {
      announcedReady = true;
      requestAnimationFrame(() => options.onReady?.());
    }
    raf = requestAnimationFrame(frame);
  };

  resize();
  const onViewportChange = () => {
    resize();
  };
  if (mobile) {
    window.addEventListener("orientationchange", onViewportChange);
  } else {
    window.addEventListener("resize", onViewportChange);
  }
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  raf = requestAnimationFrame(frame);

  return {
    setReducedMotion(value: boolean) {
      reducedMotion = value;
    },
    setPalette(palette: CrystalPalette) {
      targetA.set(...palette.a);
      targetB.set(...palette.b);
      targetC.set(...palette.c);
      if (reducedMotion) {
        colorA.copy(targetA);
        colorB.copy(targetB);
        colorC.copy(targetC);
        applyColors();
      }
    },
    setEpicenterOffset(offset: { x: number; y: number }) {
      epicenterOffset = offset;
      applyEpicenter();
    },
    setEpicenterScale(scale: number) {
      epicenterScale = scale;
      applyEpicenter();
    },
    destroy() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (mobile) {
        window.removeEventListener("orientationchange", onViewportChange);
      } else {
        window.removeEventListener("resize", onViewportChange);
      }
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      (layerA.material as THREE.ShaderMaterial).dispose();
      (layerB.material as THREE.ShaderMaterial).dispose();
      renderer.dispose();
    },
  };
}
