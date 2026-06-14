const state = {
  color: "#151515",
  colorName: "Blacktop",
  productName: "After Hours Tee",
  price: "₩49,000",
  bagCount: 0,
  size: "M",
};

let threeApi = null;

initShopControls();
loadScene();

async function loadScene() {
  try {
    const THREE = await import("three");
    threeApi = createShirtScene(THREE);
    threeApi.setColor(state.color, state.productName);
  } catch (error) {
    const fallback = document.querySelector("#sceneFallback");
    if (fallback) {
      fallback.hidden = false;
    }
    console.warn("3D scene unavailable", error);
  }
}

function initShopControls() {
  const swatches = document.querySelectorAll(".swatch");
  const sizeButtons = document.querySelectorAll("#sizes button");
  const cards = document.querySelectorAll(".tee-card");
  const addButton = document.querySelector("#addToBag");
  const heroAddButton = document.querySelector("#heroAddToBag");
  const stickyAddButton = document.querySelector("#stickyAddToBag");
  const dockBag = document.querySelector("#dockBag");
  const cartCount = document.querySelector("#cartCount");
  const productName = document.querySelector("#productName");
  const productPrice = document.querySelector("#productPrice");
  const selectedColorName = document.querySelector("#selectedColorName");
  const selectedSize = document.querySelector("#selectedSize");
  const selectedColorLabel = document.querySelector("#selectedColorLabel");
  const selectedSizeLabel = document.querySelector("#selectedSizeLabel");
  const stickyProductName = document.querySelector("#stickyProductName");
  const stickySelection = document.querySelector("#stickySelection");
  const stickyPrice = document.querySelector("#stickyPrice");
  const toast = document.querySelector("#toast");

  swatches.forEach((button) => {
    button.addEventListener("click", () => {
      swatches.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      state.color = button.dataset.color || state.color;
      state.colorName = button.dataset.name || state.colorName;
      threeApi?.setColor(state.color, state.productName);
      renderSelection();
    });
  });

  sizeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      sizeButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      state.size = button.textContent?.trim() || state.size;
      renderSelection();
    });
  });

  cards.forEach((card) => {
    card.addEventListener("click", () => {
      const nextName = card.dataset.product || state.productName;
      const nextColor = card.dataset.color || state.color;
      const nextColorName = card.dataset.colorName || getColorName(nextColor);
      const nextPrice = card.dataset.price || state.price;
      state.productName = nextName;
      state.color = nextColor;
      state.colorName = nextColorName;
      state.price = nextPrice;
      cards.forEach((item) => item.classList.remove("is-selected"));
      card.classList.add("is-selected");
      swatches.forEach((item) => {
        item.classList.toggle("is-active", item.dataset.color === nextColor);
      });
      threeApi?.setColor(nextColor, nextName);
      renderSelection();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  addButton?.addEventListener("click", () => {
    addToBag();
  });

  heroAddButton?.addEventListener("click", () => {
    addToBag();
  });

  stickyAddButton?.addEventListener("click", () => {
    addToBag();
  });

  dockBag?.addEventListener("click", () => {
    addToBag();
  });

  renderSelection();

  function addToBag() {
    state.bagCount += 1;
    if (cartCount) {
      cartCount.textContent = String(state.bagCount);
    }
    if (toast) {
      toast.textContent = `${state.productName} / ${state.size}`;
      toast.classList.add("is-visible");
      window.clearTimeout(initShopControls.toastTimer);
      initShopControls.toastTimer = window.setTimeout(() => {
        toast.classList.remove("is-visible");
      }, 1700);
    }
  }

  function renderSelection() {
    if (productName) productName.textContent = state.productName;
    if (productPrice) productPrice.textContent = state.price;
    if (selectedColorName) selectedColorName.textContent = state.colorName;
    if (selectedSize) selectedSize.textContent = state.size;
    if (selectedColorLabel) selectedColorLabel.textContent = state.colorName;
    if (selectedSizeLabel) selectedSizeLabel.textContent = state.size;
    if (stickyProductName) stickyProductName.textContent = state.productName;
    if (stickySelection) stickySelection.textContent = `${state.colorName} / ${state.size}`;
    if (stickyPrice) stickyPrice.textContent = state.price;
  }
}

function getColorName(color) {
  const names = {
    "#151515": "Blacktop",
    "#f0eee5": "Bone",
    "#b7ff3c": "Acid Lime",
    "#eb4d37": "Heat",
  };
  return names[color] || "Custom";
}

function createShirtScene(THREE) {
  const canvas = document.querySelector("#shirtScene");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.04;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0.15, 0.25, 6.3);

  const key = new THREE.DirectionalLight(0xffffff, 2.9);
  key.position.set(2.8, 4.2, 4);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x39d6e6, 3.1);
  rim.position.set(-3.2, 1.4, 2.2);
  scene.add(rim);

  const fill = new THREE.HemisphereLight(0xf4f0e8, 0x17171b, 2.1);
  scene.add(fill);

  const group = new THREE.Group();
  group.rotation.set(-0.08, -0.36, -0.04);
  scene.add(group);

  const shirtShape = makeShirtShape(THREE);
  const shirtGeometry = new THREE.ExtrudeGeometry(shirtShape, {
    depth: 0.18,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.035,
    bevelSegments: 4,
    curveSegments: 18,
  });
  shirtGeometry.center();

  const shirtMaterial = new THREE.MeshPhysicalMaterial({
    color: state.color,
    roughness: 0.78,
    metalness: 0.02,
    clearcoat: 0.16,
    clearcoatRoughness: 0.9,
    side: THREE.DoubleSide,
  });

  const shirt = new THREE.Mesh(shirtGeometry, shirtMaterial);
  shirt.castShadow = true;
  shirt.receiveShadow = true;
  group.add(shirt);

  const printTexture = makePrintTexture(THREE, state.color, state.productName);
  const printMaterial = new THREE.MeshBasicMaterial({
    map: printTexture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const print = new THREE.Mesh(new THREE.PlaneGeometry(1.38, 1.05), printMaterial);
  print.position.set(0, -0.22, 0.145);
  print.rotation.z = -0.02;
  group.add(print);

  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.31, 0.035, 12, 64),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.72,
      transparent: true,
      opacity: 0.92,
    }),
  );
  collar.scale.set(1.1, 0.58, 0.16);
  collar.position.set(0, 0.92, 0.152);
  group.add(collar);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(2.15, 80),
    new THREE.MeshBasicMaterial({
      color: 0x39d6e6,
      transparent: true,
      opacity: 0.13,
      side: THREE.DoubleSide,
    }),
  );
  floor.position.set(0.12, -1.58, -0.32);
  floor.rotation.x = Math.PI / 2;
  group.add(floor);

  const particles = makeParticleField(THREE);
  scene.add(particles);

  let pointerTarget = { x: 0, y: 0 };
  let dragStart = null;
  let floatBaseY = 0.04;

  window.addEventListener("pointermove", (event) => {
    pointerTarget = {
      x: (event.clientX / window.innerWidth - 0.5) * 0.25,
      y: (event.clientY / window.innerHeight - 0.5) * 0.18,
    };
  });

  canvas.addEventListener("pointerdown", (event) => {
    dragStart = { x: event.clientX, rotation: group.rotation.y };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragStart) return;
    const delta = (event.clientX - dragStart.x) / 180;
    group.rotation.y = dragStart.rotation + delta;
  });

  canvas.addEventListener("pointerup", (event) => {
    dragStart = null;
    canvas.releasePointerCapture(event.pointerId);
  });

  const resize = () => {
    const parent = canvas.parentElement;
    const width = Math.max(parent?.clientWidth || window.innerWidth, 320);
    const height = Math.max(parent?.clientHeight || 520, 360);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    const narrow = width < 700;
    group.scale.setScalar(narrow ? 0.78 : 0.74);
    floatBaseY = narrow ? -0.05 : -0.48;
    group.position.set(narrow ? 0 : -0.18, floatBaseY, 0);
  };
  resize();
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();
  const animate = () => {
    const time = clock.getElapsedTime();
    if (!dragStart) {
      group.rotation.y += (Math.sin(time * 0.48) * 0.36 + pointerTarget.x - group.rotation.y) * 0.035;
    }
    group.rotation.x += (-0.08 + pointerTarget.y - group.rotation.x) * 0.035;
    group.position.y += (Math.sin(time * 1.2) * 0.035 + floatBaseY - group.position.y) * 0.025;
    particles.rotation.y = time * 0.035;
    particles.rotation.x = Math.sin(time * 0.17) * 0.05;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();

  return {
    setColor(nextColor, nextName) {
      shirtMaterial.color.set(nextColor);
      printMaterial.map?.dispose();
      printMaterial.map = makePrintTexture(THREE, nextColor, nextName);
      printMaterial.needsUpdate = true;
      const lightness = getLightness(nextColor);
      collar.material.color.set(lightness > 0.65 ? 0x111111 : 0xffffff);
      collar.material.opacity = lightness > 0.65 ? 0.55 : 0.9;
    },
  };
}

function makeShirtShape(THREE) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.74, 1.02);
  shape.lineTo(-1.34, 0.77);
  shape.lineTo(-1.88, 0.12);
  shape.lineTo(-1.55, -0.46);
  shape.lineTo(-1.08, -0.25);
  shape.lineTo(-1.03, -1.42);
  shape.quadraticCurveTo(-0.62, -1.52, 0, -1.52);
  shape.quadraticCurveTo(0.62, -1.52, 1.03, -1.42);
  shape.lineTo(1.08, -0.25);
  shape.lineTo(1.55, -0.46);
  shape.lineTo(1.88, 0.12);
  shape.lineTo(1.34, 0.77);
  shape.lineTo(0.74, 1.02);
  shape.quadraticCurveTo(0.55, 0.71, 0.28, 0.61);
  shape.quadraticCurveTo(0, 0.52, -0.28, 0.61);
  shape.quadraticCurveTo(-0.55, 0.71, -0.74, 1.02);

  const neck = new THREE.Path();
  neck.absellipse(0, 0.85, 0.3, 0.18, 0, Math.PI * 2, true, 0);
  shape.holes.push(neck);
  return shape;
}

function makePrintTexture(THREE, color, productName) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const ctx = canvas.getContext("2d");
  const lightness = getLightness(color);
  const ink = lightness > 0.58 ? "#111114" : "#f4f0e8";
  const accent = lightness > 0.58 ? "#eb4d37" : "#b7ff3c";

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 1400; i += 1) {
    ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#000000";
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }
  ctx.globalAlpha = 1;

  const label = productName.replace(" Tee", "").toUpperCase();
  drawCocPrintLogo(ctx, 512, 342, 1, ink, accent);
  ctx.fillStyle = accent;
  ctx.fillRect(276, 624, 472, 18);
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 34px Arial, sans-serif";
  wrapText(ctx, label, 512, 684, 540, 38);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function drawCocPrintLogo(ctx, x, y, scale, ink, accent) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "900 96px Arial, sans-serif";
  ctx.fillText("COC", 0, -185);

  ctx.strokeStyle = ink;
  ctx.lineWidth = 10;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.ellipse(0, -16, 106, 96, 0.1, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.56;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(0, -16, 182, 42, -0.24, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(0, -18, 38, 31, -0.1, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.58;
  ctx.lineWidth = 4;
  [
    [-70, -52, -36, -66],
    [42, -70, 74, -58],
    [-82, -8, -48, -20],
    [56, 18, 86, 30],
    [-34, 54, 22, 60],
  ].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  ctx.globalAlpha = 1;
  ctx.fillStyle = ink;
  ctx.font = "700 40px Arial, sans-serif";
  ctx.fillText("CRATER", 0, 128);
  ctx.font = "700 17px Arial, sans-serif";
  ctx.fillText("OF", 0, 164);
  ctx.font = "700 40px Arial, sans-serif";
  ctx.fillText("CREATOR", 0, 202);
  ctx.font = "800 18px Arial, sans-serif";
  ctx.fillText("FOR CREATIVE MINDS", 0, 238);
  ctx.restore();
}

function makeParticleField(THREE) {
  const geometry = new THREE.BufferGeometry();
  const count = 190;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 3 - 0.5;
  }
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xf4f0e8,
    size: 0.018,
    transparent: true,
    opacity: 0.48,
  });
  return new THREE.Points(geometry, material);
}

function getLightness(hex) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return (Math.max(r, g, b) + Math.min(r, g, b)) / 2;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  });
  lines.push(line);
  const start = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((item, index) => {
    ctx.fillText(item, x, start + index * lineHeight);
  });
}
