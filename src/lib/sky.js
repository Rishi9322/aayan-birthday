// Lazy-loaded Three.js scene. Intro: shader nebula + star field + 3D balloons. Finale: shader aurora.
import {
  Scene, PerspectiveCamera, OrthographicCamera, WebGLRenderer, PlaneGeometry, ShaderMaterial, Mesh, Vector2,
  BufferGeometry, Float32BufferAttribute, Points, PointsMaterial, CanvasTexture, SphereGeometry, ConeGeometry,
  Raycaster, MeshStandardMaterial, AmbientLight, DirectionalLight, Group, Line, LineBasicMaterial, Color, AdditiveBlending,
} from 'three';
import { tilt, reduced, rand, palette } from './fx.js';

const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
const NOISE = `
uniform float t; uniform vec2 res; varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(h(i), h(i + vec2(1,0)), f.x), mix(h(i + vec2(0,1)), h(i + vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; for(int i = 0; i < 4; i++){ v += a * n(p); p *= 2.; a *= .5; } return v; }`;
const NEBULA = NOISE + `void main(){
  vec2 p = vUv * vec2(res.x / res.y, 1.) * 2.;
  float f = fbm(p + vec2(t * .03, 0.) + fbm(p * 1.5 - t * .02));
  vec3 c = mix(vec3(.04, .06, .15), vec3(.5, .18, .7), f * .65);
  c = mix(c, vec3(.08, .65, .65), smoothstep(.5, .95, fbm(p * .8 + 5.)) * .3);
  gl_FragColor = vec4(c, 1.); }`;
const AURORA = NOISE + `void main(){
  vec2 uv = vUv; float x = uv.x * 3.; float w = fbm(vec2(x + t * .05, t * .08));
  float band = smoothstep(0., .5, 1. - abs(uv.y - (.58 + .12 * sin(x * 2. + t * .3) + w * .25)) * 3.2);
  vec3 g = mix(vec3(.18, .9, .7), vec3(.7, .3, .9), uv.x + w * .3);
  vec3 c = mix(vec3(.03, .05, .14), g, band * .65 * (.45 + w));
  gl_FragColor = vec4(c, 1.); }`;

function dot() {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'), r = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  r.addColorStop(0, '#fff'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 32, 32);
  return new CanvasTexture(c);
}

export function mount(canvas, { shader = 'nebula', world = true } = {}) {
  const R = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  R.setPixelRatio(Math.min(devicePixelRatio, shader === 'aurora' ? 1 : 1.5));
  R.autoClear = false;

  const bgScene = new Scene(), bgCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const u = { t: { value: 0 }, res: { value: new Vector2(1, 1) } };
  const quad = new Mesh(new PlaneGeometry(2, 2), new ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: shader === 'aurora' ? AURORA : NEBULA, depthTest: false, depthWrite: false }));
  quad.frustumCulled = false;
  bgScene.add(quad);

  let scene, cam, stars, launched = false;
  const balloons = [];
  if (world) {
    scene = new Scene();
    cam = new PerspectiveCamera(50, 1, .1, 60);
    cam.position.z = 8;
    scene.add(new AmbientLight(0xffffff, 1.1));
    const sun = new DirectionalLight(0xffffff, 2.2); sun.position.set(2, 3, 5); scene.add(sun);

    const pos = [];
    for (let i = 0; i < 900; i++) pos.push(rand(-14, 14), rand(-9, 9), rand(-22, -2));
    const sg = new BufferGeometry(); sg.setAttribute('position', new Float32BufferAttribute(pos, 3));
    stars = new Points(sg, new PointsMaterial({ size: .22, map: dot(), transparent: true, depthWrite: false, blending: AdditiveBlending, sizeAttenuation: true }));
    scene.add(stars);

    const cols = palette();
    const body = new SphereGeometry(.5, 20, 16), knot = new ConeGeometry(.08, .16, 8);
    const sMat = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5 });
    for (let i = 0; i < 9; i++) {
      const g = new Group(), m = new MeshStandardMaterial({ color: new Color(cols[i % 4]), roughness: .3, metalness: .05 });
      const b = new Mesh(body, m); b.scale.set(1, 1.25, 1);
      const k = new Mesh(knot, m); k.position.y = -.68; k.rotation.z = Math.PI;
      const s = new Line(new BufferGeometry().setFromPoints([{ x: 0, y: -.75, z: 0 }, { x: .08, y: -1.2, z: 0 }, { x: -.06, y: -1.7, z: 0 }]), sMat);
      g.add(b, k, s); g.visible = false; scene.add(g);
      // rx keeps balloons to the sides so the title stays clear
      balloons.push({ g, rx: (Math.random() < .5 ? -1 : 1) * rand(.5, 1), y: 0, z: rand(-4, 1), v: rand(.45, .9), ph: rand(0, 6.28) });
    }
  }

  const halfW = () => Math.tan(25 * Math.PI / 180) * 8 * cam.aspect;
  function size() {
    const w = canvas.clientWidth || innerWidth, h = canvas.clientHeight || innerHeight;
    R.setSize(w, h, false);
    u.res.value.set(w * R.getPixelRatio(), h * R.getPixelRatio());
    if (cam) { cam.aspect = w / h; cam.updateProjectionMatrix(); const s = Math.min(1, .5 + cam.aspect * .5); balloons.forEach(b => b.g.scale.setScalar(s)); }
    if (reduced) frame(0);
  }

  let time = 0, last = 0, raf = 0, vis = true;
  function frame(dt) {
    time += dt; u.t.value = time;
    if (world) {
      stars.rotation.z = time * .01;
      cam.position.x += (tilt.x * 1.1 - cam.position.x) * .05;
      cam.position.y += (-tilt.y * .8 - cam.position.y) * .05;
      cam.lookAt(0, 0, 0);
      const hw = halfW();
      for (const b of balloons) {
        if (launched && !reduced) { b.y += b.v * dt; if (b.y > 6.5) b.y = -6.5; }
        b.g.position.set(b.rx * hw * .85 + Math.sin(time * .8 + b.ph) * .25, b.y, b.z);
        b.g.rotation.z = Math.sin(time * .9 + b.ph) * .12;
      }
    }
    R.clear();
    R.render(bgScene, bgCam);
    if (world) R.render(scene, cam);
  }
  function loop(ts) { raf = 0; frame(Math.min(.05, (ts - (last || ts)) / 1000)); last = ts; kick(); }
  function kick() { if (!raf && vis && !document.hidden && !reduced) raf = requestAnimationFrame(loop); }
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; last = 0; kick(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { last = 0; kick(); });
  new ResizeObserver(size).observe(canvas);
  size(); kick();

  const rc = new Raycaster(), ndc = new Vector2();
  return {
    // Tap a balloon: returns its colour (and sends it back below the screen) or null.
    pick(cx, cy) {
      if (!world || !launched) return null;
      const r = canvas.getBoundingClientRect();
      ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      rc.setFromCamera(ndc, cam);
      const hit = rc.intersectObjects(balloons.map(b => b.g.children[0]), false)[0];
      if (!hit) return null;
      balloons.find(b => b.g.children[0] === hit.object).y = -6.5;
      if (reduced) frame(0);
      return '#' + hit.object.material.color.getHexString();
    },
    // Balloons float up from below the screen, staggered.
    launch() {
      launched = true;
      balloons.forEach((b, i) => { b.y = reduced ? rand(-3, 3) : -6.5 - i * 1.3; b.g.visible = true; });
      if (reduced) frame(0);
    },
  };
}
