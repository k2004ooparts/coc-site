const state = {
  color: "#151515",
  colorName: "Blacktop",
  productName: "After Hours Tee",
  price: "₩49,000",
  size: "M",
  cartItems: [],
  isCartOpen: false,
};

let threeApi = null;
let toastTimer = null;

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
  const elements = getShopElements();

  elements.swatches.forEach((button) => {
    button.addEventListener("click", () => {
      elements.swatches.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      state.color = button.dataset.color || state.color;
      state.colorName = button.dataset.name || state.colorName;
      threeApi?.setColor(state.color, state.productName);
      renderSelection();
      syncPressedStates(elements);
    });
  });

  elements.sizeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      elements.sizeButtons.forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      state.size = button.textContent?.trim() || state.size;
      renderSelection();
      syncPressedStates(elements);
    });
  });

  elements.cards.forEach((card) => {
    const selectCard = () => {
      selectProduct(card, elements);
    };

    card.addEventListener("click", selectCard);
    card.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      selectCard();
    });
  });

  [elements.addButton, elements.heroAddButton, elements.stickyAddButton].forEach((button) => {
    button?.addEventListener("click", () => {
      addToBag(elements);
    });
  });

  elements.cartToggle?.addEventListener("click", () => {
    setCartOpen(!state.isCartOpen, elements);
  });

  elements.dockBag?.addEventListener("click", () => {
    setCartOpen(true, elements);
  });

  elements.cartClose?.addEventListener("click", () => {
    setCartOpen(false, elements);
  });

  elements.cartOverlay?.addEventListener("click", () => {
    setCartOpen(false, elements);
  });

  elements.cartItems?.addEventListener("click", (event) => {
    updateCartQuantity(event, elements);
  });

  elements.checkoutButton?.addEventListener("click", () => {
    showToast("Drop reserved");
    setCartOpen(false, elements);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setCartOpen(false, elements);
    }
  });

  renderSelection();
  renderCart(elements);
  syncPressedStates(elements);
}

function getShopElements() {
  return {
    swatches: document.querySelectorAll(".swatch"),
    sizeButtons: document.querySelectorAll("#sizes button"),
    cards: document.querySelectorAll(".tee-card"),
    addButton: document.querySelector("#addToBag"),
    heroAddButton: document.querySelector("#heroAddToBag"),
    stickyAddButton: document.querySelector("#stickyAddToBag"),
    dockBag: document.querySelector("#dockBag"),
    cartToggle: document.querySelector("#cartToggle"),
    cartClose: document.querySelector("#cartClose"),
    cartOverlay: document.querySelector("#cartOverlay"),
    cartDrawer: document.querySelector("#cartDrawer"),
    cartItems: document.querySelector("#cartItems"),
    cartEmpty: document.querySelector("#cartEmpty"),
    cartTotal: document.querySelector("#cartTotal"),
    cartCount: document.querySelector("#cartCount"),
    checkoutButton: document.querySelector("#cartCheckout"),
    productName: document.querySelector("#productName"),
    productPrice: document.querySelector("#productPrice"),
    selectedColorName: document.querySelector("#selectedColorName"),
    selectedSize: document.querySelector("#selectedSize"),
    selectedColorLabel: document.querySelector("#selectedColorLabel"),
    selectedSizeLabel: document.querySelector("#selectedSizeLabel"),
    stickyProductName: document.querySelector("#stickyProductName"),
    stickySelection: document.querySelector("#stickySelection"),
    stickyPrice: document.querySelector("#stickyPrice"),
  };
}

function selectProduct(card, elements) {
  const nextName = card.dataset.product || state.productName;
  const nextColor = card.dataset.color || state.color;
  const nextColorName = card.dataset.colorName || getColorName(nextColor);
  const nextPrice = card.dataset.price || state.price;
  state.productName = nextName;
  state.color = nextColor;
  state.colorName = nextColorName;
  state.price = nextPrice;

  elements.cards.forEach((item) => item.classList.remove("is-selected"));
  card.classList.add("is-selected");
  elements.swatches.forEach((item) => {
    item.classList.toggle("is-active", item.dataset.color === nextColor);
  });

  threeApi?.setColor(nextColor, nextName);
  renderSelection();
  syncPressedStates(elements);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function addToBag(elements) {
  const id = [state.productName, state.colorName, state.size].join("|");
  const existingItem = state.cartItems.find((item) => item.id === id);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cartItems.push({
      id,
      name: state.productName,
      color: state.color,
      colorName: state.colorName,
      size: state.size,
      price: state.price,
      priceValue: parseWon(state.price),
      quantity: 1,
    });
  }

  renderCart(elements);
  setCartOpen(true, elements);
  showToast(`${state.productName} / ${state.size} added`);
}

function updateCartQuantity(event, elements) {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;

  const item = state.cartItems.find((cartItem) => cartItem.id === button.dataset.key);
  if (!item) return;

  if (button.dataset.cartAction === "increase") {
    item.quantity += 1;
  } else {
    item.quantity -= 1;
  }

  state.cartItems = state.cartItems.filter((cartItem) => cartItem.quantity > 0);
  renderCart(elements);
}

function renderSelection() {
  const elements = getShopElements();
  if (elements.productName) elements.productName.textContent = state.productName;
  if (elements.productPrice) elements.productPrice.textContent = state.price;
  if (elements.selectedColorName) elements.selectedColorName.textContent = state.colorName;
  if (elements.selectedSize) elements.selectedSize.textContent = state.size;
  if (elements.selectedColorLabel) elements.selectedColorLabel.textContent = state.colorName;
  if (elements.selectedSizeLabel) elements.selectedSizeLabel.textContent = state.size;
  if (elements.stickyProductName) elements.stickyProductName.textContent = state.productName;
  if (elements.stickySelection) elements.stickySelection.textContent = `${state.colorName} / ${state.size}`;
  if (elements.stickyPrice) elements.stickyPrice.textContent = state.price;
}

function renderCart(elements = getShopElements()) {
  const itemCount = getCartItemCount();
  const total = state.cartItems.reduce((sum, item) => sum + item.priceValue * item.quantity, 0);

  if (elements.cartCount) elements.cartCount.textContent = String(itemCount);
  if (elements.cartTotal) elements.cartTotal.textContent = formatWon(total);
  if (elements.cartEmpty) elements.cartEmpty.hidden = itemCount > 0;
  if (elements.checkoutButton) elements.checkoutButton.disabled = itemCount === 0;
  if (!elements.cartItems) return;

  elements.cartItems.innerHTML = state.cartItems
    .map(
      (item) => `
        <article class="cart-line">
          <div class="cart-thumb" style="--item-color: ${item.color}"></div>
          <div>
            <h3>${escapeHtml(item.name)}</h3>
            <p>${escapeHtml(item.colorName)} / ${escapeHtml(item.size)}</p>
            <strong>${escapeHtml(item.price)}</strong>
          </div>
          <div class="quantity-control" aria-label="${escapeHtml(item.name)} quantity">
            <button type="button" data-cart-action="decrease" data-key="${escapeHtml(item.id)}" aria-label="Decrease quantity">-</button>
            <span>${item.quantity}</span>
            <button type="button" data-cart-action="increase" data-key="${escapeHtml(item.id)}" aria-label="Increase quantity">+</button>
          </div>
        </article>
      `,
    )
    .join("");
}

function setCartOpen(isOpen, elements = getShopElements()) {
  state.isCartOpen = isOpen;
  document.body.classList.toggle("cart-open", isOpen);
  elements.cartDrawer?.classList.toggle("is-open", isOpen);
  elements.cartDrawer?.setAttribute("aria-hidden", String(!isOpen));
  elements.cartToggle?.setAttribute("aria-expanded", String(isOpen));

  if (elements.cartOverlay) {
    elements.cartOverlay.hidden = !isOpen;
  }
}

function syncPressedStates(elements) {
  elements.swatches.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
  });
  elements.sizeButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
  });
}

function getCartItemCount() {
  return state.cartItems.reduce((sum, item) => sum + item.quantity, 0);
}

function parseWon(price) {
  return Number(price.replace(/[^\d]/g, "")) || 0;
}

function formatWon(value) {
  return `₩${value.toLocaleString("ko-KR")}`;
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1700);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
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
