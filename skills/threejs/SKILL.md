---
name: threejs
description: Use this skill when the user wants to create 3D graphics, animations, interactive scenes, or visualizations using Three.js in the browser. Triggers include: any mention of 'three.js', '3D scene', '3D animation', 'WebGL', 'WebGPU', '3D canvas', rotating cube, particle systems, 3D models, GLTF, orbit controls, shaders, and any request to build an interactive or animated 3D experience in HTML or React. Also use when the user wants to render 3D objects, create immersive visuals, or build browser-based 3D apps.
---

This skill guides the creation of high-quality, production-ready 3D scenes and animations using Three.js in browser environments (HTML artifacts or React artifacts).

---

## Quando Usar Esta Skill

### ✅ USE Three.js quando o usuário pedir:
- Cenas 3D interativas no browser (cubo rotacionando, esferas, objetos 3D)
- Animações e efeitos visuais em 3D
- Visualizações de dados em 3D (gráficos de barras 3D, scatter plots, globos)
- Jogos simples no browser com perspectiva 3D
- Portfólios / landing pages com elementos 3D imersivos
- Sistemas de partículas (estrelas, neve, poeira, explosões)
- Carregamento e exibição de modelos 3D (.glb / .gltf)
- Configuradores de produto 3D (ex: customizar cor de um carro)
- Experiências WebXR (VR/AR no browser)
- Efeitos de shader e pós-processamento visual (bloom, glitch, blur)
- Simulações físicas visuais (órbitas, fluidos, ondas)

### ❌ NÃO USE Three.js quando:
- O usuário quer gráficos 2D simples → use Canvas 2D API ou SVG
- Quer gráficos de dados (barras, pizza, linha) → use Chart.js ou Recharts
- Quer animações CSS simples → use CSS transitions/animations
- Quer apenas um efeito de fundo decorativo leve → considere CSS ou Canvas 2D
- O artefato é React e precisa de recursos pós-r128 (WebGPU, NodeMaterial, CapsuleGeometry) → use HTML artifact em vez de React

### 🤔 CONSIDERE Three.js quando:
- O usuário menciona "imersivo", "interativo", "3D", "efeito visual avançado"
- A experiência exige profundidade, rotação ou perspectiva
- Há menção a WebGL, shaders, ou renderização em tempo real
- O projeto é criativo / artístico e se beneficiaria de visuais distintos

---

## Version & Import Strategy

**Current stable version: r183** (as of April 2026). A new release ships roughly monthly.

### For HTML Artifacts (recommended — zero config, works immediately)

Use an `importmap` with jsDelivr CDN. Always keep all imports on the **same version**:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.183.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.183.0/examples/jsm/"
  }
}
</script>

<script type="module">
  import * as THREE from 'three';
  import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
</script>
```

**CRITICAL**: Always match versions. Never mix `three@0.183.0` with addons from a different version — this causes silent breakage.

### For React Artifacts (claude.ai artifacts)

Three.js r128 is pre-bundled and available as:
```js
import * as THREE from 'three';
```
⚠️ **r128 is old** — avoid features introduced after r128 (e.g., `WebGPURenderer`, `NodeMaterial`, `CapsuleGeometry`). Stick to stable, long-standing APIs.

---

## Scene Boilerplate (HTML)

Every Three.js scene requires these 4 elements:

```js
// 1. Scene — the container for all 3D objects
const scene = new THREE.Scene();

// 2. Camera — perspective (most common) or orthographic
const camera = new THREE.PerspectiveCamera(
  75,                                    // FOV in degrees
  window.innerWidth / window.innerHeight, // aspect ratio
  0.1,                                   // near clipping plane
  1000                                   // far clipping plane
);
camera.position.z = 5;

// 3. Renderer — draws the scene to a canvas
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// 4. Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
```

---

## Geometries

```js
// Built-in geometries
new THREE.BoxGeometry(1, 1, 1)              // cube/box
new THREE.SphereGeometry(0.5, 32, 32)       // sphere (radius, widthSegs, heightSegs)
new THREE.CylinderGeometry(0.5, 0.5, 1, 32) // cylinder
new THREE.TorusGeometry(1, 0.4, 16, 100)    // donut/torus
new THREE.TorusKnotGeometry(1, 0.3, 100, 16)// torus knot
new THREE.PlaneGeometry(5, 5)               // flat plane
new THREE.IcosahedronGeometry(1, 0)         // icosahedron (good for low-poly spheres)
new THREE.ConeGeometry(0.5, 1, 32)          // cone

// CapsuleGeometry — available from r142+, NOT in r128
// Use CylinderGeometry + SphereGeometry for r128 compatibility
```

---

## Materials

```js
// MeshBasicMaterial — no lighting, always visible
new THREE.MeshBasicMaterial({ color: 0xff0000 })

// MeshStandardMaterial — PBR, requires lights (recommended for realism)
new THREE.MeshStandardMaterial({
  color: 0x44aa88,
  roughness: 0.5,   // 0 = mirror, 1 = fully rough
  metalness: 0.0,   // 0 = plastic, 1 = metal
})

// MeshPhongMaterial — older shading model, cheaper than PBR
new THREE.MeshPhongMaterial({ color: 0x44aa88, shininess: 100 })

// MeshNormalMaterial — colors based on normals, no lighting needed (great for debugging)
new THREE.MeshNormalMaterial()

// MeshToonMaterial — cartoon/cel shading
new THREE.MeshToonMaterial({ color: 0x44aa88 })

// Wireframe
new THREE.MeshBasicMaterial({ wireframe: true, color: 0x00ff00 })

// Transparency
new THREE.MeshStandardMaterial({
  color: 0x4488ff,
  transparent: true,
  opacity: 0.5
})
```

---

## Lights

> `MeshStandardMaterial` and `MeshPhongMaterial` require lights. `MeshBasicMaterial` and `MeshNormalMaterial` do not.

```js
// AmbientLight — uniform, no shadows, base fill light
const ambient = new THREE.AmbientLight(0xffffff, 0.5); // color, intensity
scene.add(ambient);

// DirectionalLight — like sunlight, parallel rays, casts shadows
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(5, 10, 5);
dirLight.castShadow = true;
scene.add(dirLight);

// PointLight — like a light bulb, radiates in all directions
const pointLight = new THREE.PointLight(0xff8800, 1, 100); // color, intensity, distance
pointLight.position.set(2, 3, 4);
scene.add(pointLight);

// HemisphereLight — sky + ground color, no shadows, great ambient replacement
const hemi = new THREE.HemisphereLight(0x87ceeb, 0x228b22, 0.6); // sky, ground, intensity
scene.add(hemi);

// SpotLight — cone-shaped, like a flashlight
const spot = new THREE.SpotLight(0xffffff, 1);
spot.position.set(0, 10, 0);
spot.angle = Math.PI / 6;
scene.add(spot);
```

---

## Adding Objects to Scene

```js
// Always: geometry + material → mesh → scene
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x44aa88 });
const mesh = new THREE.Mesh(geometry, material);

mesh.position.set(0, 0, 0);
mesh.rotation.set(0, 0, 0); // in radians
mesh.scale.set(1, 1, 1);
mesh.castShadow = true;
mesh.receiveShadow = true;

scene.add(mesh);
```

---

## Animation Patterns

```js
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime(); // total seconds since start
  const delta = clock.getDelta();         // seconds since last frame

  // Rotation
  mesh.rotation.x = elapsed * 0.5;
  mesh.rotation.y = elapsed * 1.0;

  // Oscillation
  mesh.position.y = Math.sin(elapsed * 2) * 0.5;

  // Scale pulse
  const s = 1 + Math.sin(elapsed * 3) * 0.2;
  mesh.scale.set(s, s, s);

  renderer.render(scene, camera);
}
```

---

## OrbitControls (Mouse/Touch Navigation)

```js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;   // smooth inertia
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.autoRotate = true;      // optional auto-spin
controls.autoRotateSpeed = 1.0;

// IMPORTANT: call in animate loop when damping/autoRotate is enabled
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // ← required!
  renderer.render(scene, camera);
}
```

---

## Shadows

```js
// Enable on renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // soft edges

// Enable on light
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;

// Enable on meshes
mesh.castShadow = true;
floor.receiveShadow = true;
```

---

## Fog

```js
// Linear fog
scene.fog = new THREE.Fog(0x000000, 1, 50); // color, near, far

// Exponential fog (more natural)
scene.fog = new THREE.FogExp2(0x000000, 0.1); // color, density
```

---

## Textures

```js
const loader = new THREE.TextureLoader();
const texture = loader.load('https://example.com/texture.jpg');

const material = new THREE.MeshStandardMaterial({ map: texture });

// Common texture types:
// map          → albedo/color
// normalMap    → surface detail bumps
// roughnessMap → PBR roughness
// metalnessMap → PBR metalness
// envMap       → reflections
// emissiveMap  → self-illumination
```

---

## Particle Systems / Points

```js
const count = 5000;
const positions = new Float32Array(count * 3);

for (let i = 0; i < count * 3; i++) {
  positions[i] = (Math.random() - 0.5) * 20;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

const material = new THREE.PointsMaterial({
  size: 0.05,
  color: 0xffffff,
  transparent: true,
  opacity: 0.8
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);
```

---

## Loading 3D Models (GLTF/GLB)

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load(
  'model.glb',
  (gltf) => {
    scene.add(gltf.scene);
  },
  (progress) => {
    console.log(`Loading: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
  },
  (error) => {
    console.error('Load error:', error);
  }
);
```

---

## Environment Maps (Reflections)

```js
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new RGBELoader().load('env.hdr', (texture) => {
  const envMap = pmremGenerator.fromEquirectangular(texture).texture;
  scene.environment = envMap; // affects all PBR materials
  scene.background = envMap;  // optional: show as background
  texture.dispose();
  pmremGenerator.dispose();
});
```

---

## Post-Processing (EffectComposer)

```js
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  1.5,  // strength
  0.4,  // radius
  0.85  // threshold
);
composer.addPass(bloom);

// In animate loop, replace renderer.render() with:
composer.render();
```

---

## WebGPU (r171+, HTML only)

```js
import WebGPU from 'three/addons/capabilities/WebGPU.js';
import WebGPURenderer from 'three/addons/renderers/common/WebGPURenderer.js';

const renderer = WebGPU.isAvailable()
  ? new WebGPURenderer({ antialias: true })
  : new THREE.WebGLRenderer({ antialias: true });

await renderer.init(); // WebGPURenderer requires async init
```

---

## Common Pitfalls & Best Practices

| Issue | Solution |
|-------|----------|
| Black screen | Check camera position, add lights, confirm mesh is in scene |
| Controls not working | Call `controls.update()` in animate loop |
| Blurry on retina screens | Set `renderer.setPixelRatio(window.devicePixelRatio)` |
| Performance lag | Reduce geometry segments, use `BufferGeometry`, dispose unused objects |
| CapsuleGeometry error in r128 | Use `CylinderGeometry` + `SphereGeometry` instead |
| Mixing CDN versions | Always use identical version strings for `three` and `three/addons/` |
| Memory leaks | Call `.dispose()` on geometries, materials, and textures when removing objects |

---

## Useful Links

- Docs: https://threejs.org/docs/
- Examples: https://threejs.org/examples/
- Editor: https://threejs.org/editor/
- Migration Guide: https://github.com/mrdoob/three.js/wiki/Migration-Guide
- GitHub: https://github.com/mrdoob/three.js
