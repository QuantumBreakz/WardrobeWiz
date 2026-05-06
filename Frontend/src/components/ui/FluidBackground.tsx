import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import * as THREE from "three";

function hexToVec4(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return new THREE.Vector4(r, g, b, 1.0);
}

const presets = [
  // 0: Navy metal (Landing)
  { spinRotation:0,  spinSpeed:2,   colour1:'#0d0d39', colour2:'#717184', colour3:'#000000', contrast:5.5, lighting:.4,  spinAmount:.25, pixelFilter:10000, grainStrength:.2, useGrain:false, effectDepth:10, zoom:4  },
  // 1: Warm rose/peach (Auth)
  { spinRotation:3,  spinSpeed:10,  colour1:'#CF907B', colour2:'#DDB1A3', colour3:'#CF907B', contrast:1.5, lighting:0,   spinAmount:.85, pixelFilter:10000, grainStrength:.2, useGrain:false, effectDepth:4,  zoom:4  },
  // 2: Blue periwinkle (Dashboard)
  { spinRotation:0,  spinSpeed:0,   colour1:'#9BABE9', colour2:'#637FDC', colour3:'#7F96E3', contrast:2,   lighting:.3,  spinAmount:0,   pixelFilter:10000, grainStrength:.5, useGrain:false, effectDepth:5,  zoom:10 },
  // 3: Steel blue with grain (Wardrobe)
  { spinRotation:1,  spinSpeed:1,   colour1:'#89A3BD', colour2:'#57687F', colour3:'#000000', contrast:3.5, lighting:.2,  spinAmount:2.5, pixelFilter:10000, grainStrength:.2, useGrain:true,  effectDepth:2,  zoom:4  },
  // 4: Soft purple (Recommend)
  { spinRotation:0,  spinSpeed:.5,  colour1:'#C5ACCA', colour2:'#9780A8', colour3:'#806A97', contrast:.8,  lighting:.2,  spinAmount:.25, pixelFilter:10,    grainStrength:.2, useGrain:false, effectDepth:7,  zoom:100},
  // 5: Near-white minimal (Outfits)
  { spinRotation:0,  spinSpeed:2,   colour1:'#fffffc', colour2:'#eeeee9', colour3:'#ddddda', contrast:3,   lighting:.15, spinAmount:.15, pixelFilter:10000, grainStrength:.2, useGrain:false, effectDepth:4,  zoom:4  },
  // 6: Cyan/magenta intense (Analytics)
  { spinRotation:0,  spinSpeed:10,  colour1:'#00ffff', colour2:'#FF33FF', colour3:'#000000', contrast:8,   lighting:.05, spinAmount:3,   pixelFilter:30,    grainStrength:1,  useGrain:true,  effectDepth:3,  zoom:50 },
];

function getPresetIndex(pathname: string): number {
  if (pathname === "/login" || pathname === "/register") return 1;
  if (pathname.includes("/wardrobe")) return 3;
  if (pathname.includes("/recommend")) return 4;
  if (pathname.includes("/outfits")) return 5;
  if (pathname.includes("/analytics")) return 6;
  if (pathname.includes("/dashboard") || pathname.includes("/admin")) return 2;
  return 0; // Landing/default
}

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
    precision highp float;

    uniform float iTime;
    uniform vec2 iResolution;
    uniform float u_zoom;
    uniform vec2 u_offset;

    uniform float spinRotation;
    uniform float spinSpeed;
    uniform vec4 colour1;
    uniform vec4 colour2;
    uniform vec4 colour3;
    uniform float contrast;
    uniform float lighting;
    uniform float spinAmount;
    uniform float pixelFilter;
    uniform float grainStrength;
    uniform float useGrain;
    uniform int effectDepth;

    varying vec2 vUv;

    float random(in vec2 st) {
      return fract(sin(dot(st, vec2(12.9898,78.233))) * 43758.5453123);
    }

    vec4 effect(vec2 screenSize, vec2 screen_coords) {
      vec2 center = 0.5 * screenSize;
      float base_pixel = length(screenSize) / pixelFilter;
      float pixel_size = base_pixel / u_zoom;
      vec2 grid_uv = floor((screen_coords - center) / base_pixel) * base_pixel + center;

      vec2 uv0 = (grid_uv - center) / screenSize.y;
      uv0 /= u_zoom;
      uv0 += u_offset;

      float uv_len = length(uv0);
      float timeOffset = iTime;
      float speed = spinRotation * 0.2;
      speed = timeOffset * speed;
      speed += 302.2;
      float angle = atan(uv0.y, uv0.x) + speed - 20.0 * (spinAmount * uv_len + (1.0 - spinAmount));

      vec2 mid = 0.5 * (screenSize / length(screenSize));
      vec2 uv = vec2(
        uv_len * cos(angle) + mid.x,
        uv_len * sin(angle) + mid.y
      ) - mid;

      uv *= 20.0;

      speed = timeOffset * spinSpeed;
      vec2 uv2 = vec2(uv.x + uv.y);
      for(int i = 0; i < 10; i++) {
        if(i >= effectDepth) break;
        uv2 += sin(max(uv.x, uv.y)) + uv;
        uv += 0.5 * vec2(
          cos(5.1123314 + 0.353 * uv2.y + speed * 0.131121),
          sin(uv2.x - 0.113 * speed)
        );
        uv -= cos(uv.x + uv.y) - sin(0.711 * uv.x - uv.y);
      }

      float contrast_mod = (0.25 * contrast + 0.5 * spinAmount + 1.2);
      float paint_res = clamp(length(uv) * 0.035 * contrast_mod, 0.0, 2.0);
      float c1p = max(0.0, 1.0 - contrast_mod * abs(1.0 - paint_res));
      float c2p = max(0.0, 1.0 - contrast_mod * abs(paint_res));
      float c3p = 1.0 - min(1.0, c1p + c2p);
      float light = (lighting - 0.2) * max(c1p * 5.0 - 4.0, 0.0)
                  + lighting * max(c2p * 5.0 - 4.0, 0.0);

      vec4 baseColor = (0.3 / contrast) * colour1
                     + (1.0 - 0.3 / contrast) * (
                         colour1 * c1p
                       + colour2 * c2p
                       + vec4(colour3.rgb * c3p, colour1.a * c3p)
                       ) + light;

      float grain_noise = random(gl_FragCoord.xy + timeOffset);
      baseColor.rgb += (useGrain > 0.5 ? grainStrength : 0.0) * (grain_noise - 0.5);

      return baseColor;
    }

    void main() {
      gl_FragColor = effect(iResolution.xy, gl_FragCoord.xy);
    }
`;

export const FluidBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const uniformsRef = useRef<any>(null);
  
  // These hold the raw values for lerping
  const currentValuesRef = useRef<any>({ ...presets[0] });
  const targetValuesRef = useRef<any>({ ...presets[0] });

  // Handle route changes
  useEffect(() => {
    const idx = getPresetIndex(location.pathname);
    const target = presets[idx];
    
    // Pre-calculate target vectors to avoid parsing in the animation loop
    targetValuesRef.current = { 
      ...target,
      c1: hexToVec4(target.colour1),
      c2: hexToVec4(target.colour2),
      c3: hexToVec4(target.colour3),
    };
    
    // Toggle dark mode on the root element based on the preset
    if (idx === 0 || idx === 3 || idx === 1) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    renderer.setPixelRatio(1.0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const p = targetValuesRef.current;
    const uniforms = {
      iTime:        { value: 0.0 },
      iResolution:  { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_zoom:       { value: p.zoom },
      u_offset:     { value: new THREE.Vector2(0, 0) },
      spinRotation: { value: p.spinRotation },
      spinSpeed:    { value: p.spinSpeed },
      colour1:      { value: hexToVec4(p.colour1) },
      colour2:      { value: hexToVec4(p.colour2) },
      colour3:      { value: hexToVec4(p.colour3) },
      contrast:     { value: p.contrast },
      lighting:     { value: p.lighting },
      spinAmount:   { value: p.spinAmount },
      pixelFilter:  { value: p.pixelFilter },
      grainStrength:{ value: p.grainStrength },
      useGrain:     { value: p.useGrain ? 1.0 : 0.0 },
      effectDepth:  { value: Math.floor(p.effectDepth) },
    };
    uniformsRef.current = uniforms;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      depthWrite: false,
      depthTest: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize, { passive: true });

    const clock = new THREE.Clock();
    let animationFrameId: number;

    const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;
    const lerpColor = (start: THREE.Vector4, end: THREE.Vector4, t: number) => {
        start.x = lerp(start.x, end.x, t);
        start.y = lerp(start.y, end.y, t);
        start.z = lerp(start.z, end.z, t);
        start.w = lerp(start.w, end.w, t);
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (document.hidden) return;

      const time = clock.getElapsedTime();
      uniforms.iTime.value = time;

      // Smoothly transition between presets
      const t = 0.05; // Lerp factor
      const target = targetValuesRef.current;
      const current = currentValuesRef.current;

      current.zoom = lerp(current.zoom, target.zoom, t);
      current.spinRotation = lerp(current.spinRotation, target.spinRotation, t);
      current.spinSpeed = lerp(current.spinSpeed, target.spinSpeed, t);
      current.contrast = lerp(current.contrast, target.contrast, t);
      current.lighting = lerp(current.lighting, target.lighting, t);
      current.spinAmount = lerp(current.spinAmount, target.spinAmount, t);
      current.pixelFilter = lerp(current.pixelFilter, target.pixelFilter, t);
      current.grainStrength = lerp(current.grainStrength, target.grainStrength, t);
      
      // Update uniforms
      uniforms.u_zoom.value = current.zoom;
      uniforms.spinRotation.value = current.spinRotation;
      uniforms.spinSpeed.value = current.spinSpeed;
      uniforms.contrast.value = current.contrast;
      uniforms.lighting.value = current.lighting;
      uniforms.spinAmount.value = current.spinAmount;
      uniforms.pixelFilter.value = current.pixelFilter;
      uniforms.grainStrength.value = current.grainStrength;
      uniforms.useGrain.value = target.useGrain ? 1.0 : 0.0;
      uniforms.effectDepth.value = target.effectDepth;

      lerpColor(uniforms.colour1.value, target.c1, t);
      lerpColor(uniforms.colour2.value, target.c2, t);
      lerpColor(uniforms.colour3.value, target.c3, t);

      renderer.render(scene, camera);
    };
    
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: -10,
        overflow: "hidden",
        background: "#000",
      }}
    />
  );
};
