// products.js - simplified, consistent implementation for cart, checkout and order details modal

// Data storage
let cart = JSON.parse(localStorage.getItem('homegym_cart')) || [];
let quantities = JSON.parse(localStorage.getItem('homegym_quantities')) || {};

// Stats (optional)
let orderCounts = JSON.parse(localStorage.getItem('homegymOrderCounts')) || {};
let clickCounts = JSON.parse(localStorage.getItem('homegymClickCounts')) || {};

// Helpers to persist
function saveCart() {
  localStorage.setItem('jazzbar_cart', JSON.stringify(cart));
  localStorage.setItem('jazzbar_quantities', JSON.stringify(quantities));
}

function saveCounts() {
  localStorage.setItem('jazzBarOrderCounts', JSON.stringify(orderCounts));
  localStorage.setItem('jazzBarClickCounts', JSON.stringify(clickCounts));
}

// Notification
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  const n = document.createElement('div');
  n.className = `notification notification-${type}`;
  n.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">×</button>`;
  Object.assign(n.style, {position: 'fixed', right: '20px', top: '20px', background: '#222', color:'#fff', padding:'10px 14px', borderRadius:'8px', zIndex:10000});
  document.body.appendChild(n);
  setTimeout(()=> { if (n.parentElement) n.remove(); }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadCountsFromStorage();
  loadCartFromStorage();
  updateAllQuantities();
  updateCartDisplay();
  setupCartTabs();
  renderOrderCountsOnProducts();
});

function loadCartFromStorage(){
  cart = JSON.parse(localStorage.getItem('homegym_cart')) || [];
  quantities = JSON.parse(localStorage.getItem('homegym_quantities')) || {};
}

// Quantity controls
function updateQuantity(productId, change) {
  const current = quantities[productId] || 0;
  const next = Math.max(0, current + change);
  quantities[productId] = next;
  const el = document.getElementById(`${productId}-qty`);
  if (el) el.textContent = next;
  // If user adjusts quantity manually, don't auto-add to cart; user must press Add button
  saveCart();
}

function updateAllQuantities(){
  Object.keys(quantities).forEach(id => {
    const el = document.getElementById(`${id}-qty`);
    if (el) el.textContent = quantities[id] || 0;
  });
}

// Cart operations
function addToCart(productId, name, price, image) {
  // initial qty lookup (may fail if productId mismatches)
  let qtyEl = document.getElementById(`${productId}-qty`);
  let qty = qtyEl ? parseInt(qtyEl.textContent,10) || 0 : (quantities[productId] || 0);

  // try to locate card early (used for fallbacks)
  let card = findProductCard(productId);
  // if card not found, try find by name
  if (!card && name) {
    const nameNorm = normalizeId(name);
    card = Array.from(document.querySelectorAll('.product-card')).find(c => {
      try { return normalizeId(c.dataset.id) === nameNorm || normalizeId(c.dataset.name) === nameNorm || (c.dataset.sku && normalizeId(c.dataset.sku) === nameNorm) || c.dataset.name === name || c.dataset.id === name; } catch(e){ return false; }
    }) || null;
  }

  // If qty is zero, try using card.dataset.id to find correct qty element (handles mismatched ids)
  if ((!qty || qty <= 0) && card) {
    const altId = card.dataset.id;
    if (altId && altId !== productId) {
      const altEl = document.getElementById(`${altId}-qty`);
      const altQty = altEl ? parseInt(altEl.textContent,10) || 0 : (quantities[altId] || 0);
      if (altQty && altQty > 0) {
        // use the alternate id as canonical id
        console.debug('addToCart: using alternate id', altId, 'qty', altQty);
        productId = altId;
        qtyEl = altEl || qtyEl;
        qty = altQty;
      }
    }
  }

  // If still no qty, but modal passed an image/name (user might have come from modal), fallback to 1
  if (!qty || qty <= 0) {
    // as a last resort try modal qty
    const modalQty = document.getElementById('productModalQty')?.textContent;
    const qFromModal = modalQty ? parseInt(modalQty,10) || 0 : 0;
    if (qFromModal > 0) {
      qty = qFromModal;
      console.debug('addToCart: using modal qty', qty);
    } else {
      // fallback default to 1 so user can still add; but inform them
      qty = 1;
      console.debug('addToCart: defaulting qty to 1 for', productId);
      showNotification('จำนวนสินค้าไม่ได้ถูกตั้ง — กำหนดเป็น 1 ให้ชั่วคราว', 'info');
    }
  }

  // Derive canonical product info from the card when available to avoid mismatches
  const derivedName = card?.dataset?.name || card?.querySelector('.product-name')?.textContent || name || 'สินค้า';
  // prefer the visible price on the card; fall back to data-price or passed price
  const domPriceRaw = card?.querySelector('.product-price')?.textContent ?? '';
  const dataPriceRaw = card?.dataset?.price ?? '';
  const derivedPrice = (parsePrice(domPriceRaw) > 0) ? parsePrice(domPriceRaw) : (parsePrice(dataPriceRaw) > 0 ? parsePrice(dataPriceRaw) : parsePrice(price));

  // Prefer the image from the product card (if available). Fallback to passed image parameter only if card image not available.
  const imgFromCard = card?.querySelector('.product-img')?.src || card?.dataset?.image || '';
  const imgSrc = imgFromCard || image || '';

  // increment click count (use canonical id)
  clickCounts[productId] = (clickCounts[productId] || 0) + 1;
  saveCounts();

  const existing = cart.find(i=>i.id===productId);
  if (existing) {
    existing.quantity += qty;
    // preserve existing image if present, otherwise set fallback
    if ((!existing.image || existing.image === '') && imgSrc) existing.image = imgSrc;
  } else {
    cart.push({ id: productId, name: derivedName, price: derivedPrice, image: imgSrc, quantity: qty });
  }

  // increment order count by quantity
  orderCounts[productId] = (orderCounts[productId] || 0) + Number(qty || 0);
  saveCounts();

  // update product cards with new counts
  renderOrderCountsOnProducts();

  // reset qty UI and state for both possible ids
  quantities[productId] = 0;
  if (qtyEl) qtyEl.textContent = '0';
  // also clear any alt qty element on the card
  if (card) {
    const altEl2 = document.getElementById(`${card.dataset.id}-qty`);
    if (altEl2) altEl2.textContent = '0';
    quantities[card.dataset.id] = 0;
  }

  saveCart();
  updateCartDisplay();
  showNotification(`เพิ่ม ${derivedName} ลงตะกร้า ${qty} ชิ้น`, 'success');
  animateToCart(productId, imgSrc);
}

function updateCartDisplay(){
  const cartCount = document.getElementById('cartCount');
  const cartItems = document.getElementById('cartItems');
  const cartTotal = document.getElementById('cartTotal');
  if (!cartItems || !cartCount || !cartTotal) return;

  const totalItems = cart.reduce((s,i)=>s+i.quantity,0);
  cartCount.textContent = totalItems;

  if (cart.length === 0) {
    cartItems.innerHTML = '<div class="empty-cart">ตะกร้าว่างเปล่า</div>';
  } else {
    cartItems.innerHTML = cart.map(item=>`
      <div class="cart-item">
        <div class="cart-item-image"><img src="${item.image}" alt="${item.name}" style="width:48px;height:48px;object-fit:cover;border-radius:6px"></div>
        <div class="cart-item-info"><h4>${item.name}</h4><p>฿${item.price} × ${item.quantity}</p></div>
        <div class="cart-item-actions">
          <button onclick="updateCartItem('${item.id}', ${Math.max(0,item.quantity-1)})">-</button>
          <span>${item.quantity}</span>
          <button onclick="updateCartItem('${item.id}', ${item.quantity+1})">+</button>
          <button onclick="removeFromCart('${item.id}')">🗑️</button>
        </div>
      </div>
    `).join('');
  }

  const total = cart.reduce((s,i)=>s + i.price*i.quantity, 0);
  cartTotal.textContent = `฿${total}`;
}

function updateCartItem(productId, newQty) {
  const idx = cart.findIndex(i=>i.id===productId);
  if (idx !== -1) {
    if (newQty <= 0) {
      cart.splice(idx,1);
    } else {
      cart[idx].quantity = newQty;
    }
    saveCart();
    updateCartDisplay();
  } else if (newQty > 0) {
    // try to find product data in DOM
    const card = findProductCard(productId);
    if (card) {
      const name = card.dataset.name;
      const price = parsePrice(card.dataset.price);
      const image = card.dataset.image;
      cart.push({ id: productId, name, price, image, quantity: newQty });
      saveCart();
      updateCartDisplay();
    }
  }
}

function removeFromCart(productId){
  cart = cart.filter(i=>i.id!==productId);
  saveCart();
  updateCartDisplay();
}

function clearCart(){
  if (!confirm('คุณต้องการล้างตะกร้าสินค้าทั้งหมดหรือไม่?')) return;
  cart = [];
  quantities = {};
  saveCart();
  updateAllQuantities();
  updateCartDisplay();
  showNotification('ล้างตะกร้าสินค้าแล้ว', 'success');
}

// Cart UI helpers
function toggleCart(){
  const sidebar = document.getElementById('cartSidebar');
  if (sidebar) sidebar.classList.toggle('active');
}

// Checkout summary
function updateCheckoutSummary(){
  const subtotal = cart.reduce((s,i)=>s + i.price*i.quantity, 0);
  const shipping = 50;
  const total = subtotal + shipping;
  const elSub = document.getElementById('summarySubtotal');
  const elShip = document.getElementById('summaryShipping');
  const elTotal = document.getElementById('summaryTotal');
  if (elSub) elSub.textContent = `฿${subtotal}`;
  if (elShip) elShip.textContent = `฿${shipping}`;
  if (elTotal) elTotal.textContent = `฿${total}`;
}

function showCheckoutTab(){
  if (cart.length === 0) { showNotification('ตะกร้าว่างเปล่า','warning'); return; }
  document.querySelector('[data-tab="checkout"]').click();
  updateCheckoutSummary();
}
function showCartTab(){ document.querySelector('[data-tab="cart"]').click(); }

function setupCartTabs(){
  const tabs = document.querySelectorAll('.cart-tab');
  const contents = document.querySelectorAll('.cart-tab-content');
  tabs.forEach(tab=>tab.addEventListener('click', ()=>{
    tabs.forEach(t=>t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    contents.forEach(c=>c.classList.remove('active'));
    const show = document.getElementById(`${target}Tab`);
    if (show) show.classList.add('active');
    if (target==='checkout') updateCheckoutSummary();
  }));
}

// Place order
function generateOrderNumber(){
  const now = new Date();
  return `JZ-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*900+100)}`;
}

function saveLastOrderToLocal(orderObj){
  localStorage.setItem('lastOrder', JSON.stringify(orderObj));
}

function placeOrder(){
  const customerName = document.getElementById('customerName')?.value.trim();
  const customerPhone = document.getElementById('customerPhone')?.value.trim();
  const deliveryAddress = document.getElementById('deliveryAddress')?.value.trim();
  if (!customerName || !customerPhone || !deliveryAddress) { showNotification('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน','warning'); return; }
  if (cart.length===0) { showNotification('ตะกร้าว่างเปล่า','warning'); return; }

  const order = {
    customer: { name: customerName, phone: customerPhone, email: document.getElementById('customerEmail')?.value.trim()||'', address: deliveryAddress, note: document.getElementById('deliveryNote')?.value.trim()||'' },
    payment: { method: document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cash' },
    items: cart.map(i=>({ id:i.id, name:i.name, quantity:i.quantity, price:i.price })),
    subtotal: cart.reduce((s,i)=>s + i.price*i.quantity,0),
    shipping: 50,
    total: 0,
    orderDate: new Date().toISOString(),
    orderNumber: generateOrderNumber()
  };
  order.total = order.subtotal + order.shipping;

  // update persistent orderCounts by the actual quantities in this order
  order.items.forEach(it => {
    orderCounts[it.id] = (orderCounts[it.id] || 0) + Number(it.quantity || 0);
  });
  saveCounts();
  renderOrderCountsOnProducts();

  saveLastOrderToLocal(order);

  // clear cart
  cart = [];
  quantities = {};
  saveCart();
  updateAllQuantities();
  updateCartDisplay();

  // show success modal (orderNumber shown)
  const orderNumberEl = document.getElementById('orderNumberText');
  if (orderNumberEl) orderNumberEl.textContent = order.orderNumber;
  const successModal = document.getElementById('orderSuccessModal');
  if (successModal) successModal.classList.add('active');

  toggleCart();
}

function closeOrderSuccessModal(){ const m = document.getElementById('orderSuccessModal'); if (m) m.classList.remove('active'); }

// Order details modal - reads lastOrder from localStorage
function openOrderDetailsModal(){
  let order=null;
  try{ order = JSON.parse(localStorage.getItem('lastOrder')); }catch(e){}
  if (!order){ alert('ไม่พบข้อมูลคำสั่งซื้อ'); return; }

  const setText = (id, v)=>{ const el=document.getElementById(id); if(el) el.textContent = v; };
  setText('modalOrderNumberText', order.orderNumber || '-');
  setText('modalOrderDateText', order.orderDate ? new Date(order.orderDate).toLocaleString() : '-');
  setText('modalCustomerNameText', order.customer?.name || '-');
  setText('modalCustomerPhoneText', order.customer?.phone || '-');
  setText('modalDeliveryAddressText', order.customer?.address || '-');
  setText('modalPaymentMethodText', order.payment?.method || '-');

  // items
  const tbody = document.getElementById('modalOrderItemsTable'); if (!tbody) return; tbody.innerHTML = '';
  const items = order.items || [];
  if (items.length===0){ tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">ไม่มีสินค้า</td></tr>'; }
  else { items.forEach(it=>{
    const name = it.name || it.productName || it.id || 'สินค้า';
    const qty = it.quantity ?? it.qty ?? 0;
    const price = it.price ?? it.unitPrice ?? 0;
    const line = qty * price;
    const tr = document.createElement('tr');
    tr.innerHTML = `<td style="text-align:left;padding-left:8px;">${name}</td><td>${qty}</td><td>฿${price}</td><td>฿${line}</td>`;
    tbody.appendChild(tr);
  }); }

  setText('modalOrderSubtotal', '฿' + (order.subtotal ?? items.reduce((s,it)=>s + ((it.price||it.unitPrice||0) * (it.quantity||it.qty||0)),0)));
  setText('modalOrderShipping', '฿' + (order.shipping ?? 50));
  setText('modalOrderTotal', '฿' + (order.total ?? 0));

  const modal = document.getElementById('orderDetailsModal'); if (modal) modal.style.display = 'block';
}
function closeOrderDetailsModal(){ const modal = document.getElementById('orderDetailsModal'); if (modal) modal.style.display = 'none'; }

// Statistics modal controls
function buildStatsHtml(){
  loadCountsFromStorage();
  const counts = orderCounts || {};
  const clicks = clickCounts || {};
  const rows = Object.keys(counts).length === 0 ? '<p>ยังไม่มีสถิติ</p>' : `<table style="width:100%;border-collapse:collapse;"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #444">สินค้า</th><th style="padding:8px;border-bottom:1px solid #444">สั่งซื้อ</th><th style="padding:8px;border-bottom:1px solid #444">คลิกเพิ่ม</th></tr></thead><tbody>${Object.keys(counts).map(id=>`<tr><td style="padding:8px;border-bottom:1px solid #333">${id}</td><td style="padding:8px;border-bottom:1px solid #333">${counts[id]||0}</td><td style="padding:8px;border-bottom:1px solid #333">${clicks[id]||0}</td></tr>`).join('')}</tbody></table>`;
  return `
    <div class="stats-grid">
      ${rows}
    </div>
  `;
}

function showStatistics(){
  const modal = document.getElementById('statsModal');
  const container = document.getElementById('statsContainer');
  if (!modal || !container) { alert('ไม่พบหน้าต่างสถิติ'); return; }
  container.innerHTML = buildStatsHtml();
  modal.classList.add('active');
}

function closeStatistics(){ const m = document.getElementById('statsModal'); if(m) m.classList.remove('active'); }

function resetStatistics(){ if(!confirm('ลบสถิติทั้งหมดใช่หรือไม่?')) return; orderCounts = {}; clickCounts = {}; saveCounts(); showNotification('รีเซ็ตสถิติเรียบร้อย', 'success'); renderOrderCountsOnProducts(); showStatistics(); }

function exportStatistics(){ loadCountsFromStorage(); const data = { orderCounts, clickCounts }; const text = JSON.stringify(data, null, 2); const blob = new Blob([text], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'jazzbar-stats.json'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }

// Simple animation to cart icon
function animateToCart(productId, image){
  const card = findProductCard(productId);
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;top:${rect.top + rect.height/2}px;left:${rect.left + rect.width/2}px;background:#ffd86b;padding:6px 10px;border-radius:16px;z-index:10000;transition:all 0.9s ease-out;`;
  el.innerHTML = `<img src="${image}" style="width:28px;height:28px;border-radius:6px;vertical-align:middle;margin-right:6px">+1`;
  document.body.appendChild(el);
  setTimeout(()=>{
    const cartIcon = document.querySelector('.cart-icon');
    if (!cartIcon) return;
    const c = cartIcon.getBoundingClientRect();
    el.style.top = `${c.top + c.height/2}px`;
    el.style.left = `${c.left + c.width/2}px`;
    el.style.opacity = '0';
    el.style.transform = 'scale(0.3)';
  },80);
  setTimeout(()=>{ if (el.parentElement) el.remove(); },1000);
}

// Click outside to close cart
document.addEventListener('click', function(e){
  const sidebar = document.getElementById('cartSidebar');
  const cartIcon = document.querySelector('.cart-icon');
  if (!sidebar || !cartIcon) return;
  if (!sidebar.contains(e.target) && !cartIcon.contains(e.target)) sidebar.classList.remove('active');
});

// Keyboard escape
document.addEventListener('keydown', e=>{ if (e.key==='Escape'){ const s=document.getElementById('cartSidebar'); if (s) s.classList.remove('active'); const m=document.getElementById('orderSuccessModal'); if (m) m.classList.remove('active'); } });

// Load saved counts
function loadCountsFromStorage(){
  orderCounts = JSON.parse(localStorage.getItem('homegymOrderCounts')) || orderCounts || {};
  clickCounts = JSON.parse(localStorage.getItem('homegymClickCounts')) || clickCounts || {};
}

// Render per-product order and click counts into product cards
function renderOrderCountsOnProducts(){
  loadCountsFromStorage();
  document.querySelectorAll('.product-card').forEach(card=>{
    if (!card) return;
    const counts = getCountsForCard(card);
    const c = counts.orders || 0;
    const k = counts.clicks || 0;
    const orderText = card.querySelector('.order-count-text');
    if (orderText) {
      orderText.textContent = `สั่งซื้อแล้ว ${c} ครั้ง`;
    }
    const clickText = card.querySelector('.click-count-text');
    if (clickText) {
      clickText.textContent = `คลิกเพิ่ม ${k} ครั้ง`;
    }
  });
}

// get order/click counts for a card by checking multiple possible keys
function getCountsForCard(card){
  if (!card) return { orders:0, clicks:0 };
  const idNorm = normalizeId(card.dataset.id || '');
  const nameNorm = normalizeId(card.dataset.name || '');
  const skuNorm = normalizeId(card.dataset.sku || '');

  // direct lookup first (keys stored might be raw productId values)
  const directKeys = [card.dataset.id, card.dataset.name, card.dataset.sku].filter(Boolean);
  for (const k of directKeys){
    if ((orderCounts && orderCounts[k]) || (clickCounts && clickCounts[k])) return { orders: orderCounts[k]||0, clicks: clickCounts[k]||0 };
  }

  // normalized lookup: compare normalized stored keys with normalized card identifiers
  const allKeys = new Set([ ...Object.keys(orderCounts||{}), ...Object.keys(clickCounts||{}) ]);
  for (const k of allKeys){
    const kn = normalizeId(k);
    if (!kn) continue;
    if (kn === idNorm || kn === nameNorm || kn === skuNorm) {
      return { orders: orderCounts[k]||0, clicks: clickCounts[k]||0 };
    }
  }

  return { orders: 0, clicks: 0 };
}

// helper to normalize identifiers (used for matching slugs)
function normalizeId(s){
  if (!s) return '';
  try {
    // preserve Unicode letters (Thai etc.) and numbers, replace other groups with hyphen
    return String(s).toLowerCase().normalize('NFKD').replace(/[^^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'')
  } catch(e) {
    // fallback for environments that don't support Unicode property escapes
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')
  }
}

// parsePrice: normalize strings like "฿1,250" or "1,250" into Number
function parsePrice(v){
  if (v === undefined || v === null) return 0;
  try{
    let s = String(v);
    // remove currency symbol and whitespace
    s = s.replace(/฿/g,'').replace(/\s+/g,'');
    // find the first numeric group (handles ranges like 1,200-1,500)
    const m = s.match(/-?\d[\d,\.\s]*/);
    if (!m) return 0;
    let num = m[0].replace(/[^0-9.\-]/g,'');
    // remove stray commas
    num = num.replace(/,/g,'');
    const n = Number(num);
    return isNaN(n) ? 0 : n;
  }catch(e){ return 0; }
}

function formatCurrency(n){
  try{ return Number(n).toLocaleString('en-US'); }catch(e){ return String(n); }
}

// findProductCard: robust lookup by data-id, data-name, data-sku or normalized name
function findProductCard(idOrName){
  if (!idOrName) return null;
  try{
    // if an element was passed, return its closest product-card
    if (idOrName instanceof Element) return idOrName.closest('.product-card') || idOrName;
  }catch(e){/* ignore */}

  // try exact match on data-id
  try{
    const esc = (window.CSS && CSS.escape) ? CSS.escape(idOrName) : idOrName;
    const byId = document.querySelector(`.product-card[data-id="${esc}"]`);
    if (byId) return byId;
  }catch(e){ /* ignore query failure */ }

  const norm = normalizeId(String(idOrName));
  const cards = Array.from(document.querySelectorAll('.product-card'));
  for (const c of cards){
    try{
      if (!c) continue;
      if (c.dataset.id === idOrName || c.dataset.name === idOrName || c.dataset.sku === idOrName) return c;
      if (normalizeId(c.dataset.id) === norm || normalizeId(c.dataset.name) === norm || (c.dataset.sku && normalizeId(c.dataset.sku) === norm)) return c;
    }catch(e){/* ignore per-card errors */}
  }

  // fallback: match by visible product-name text
  for (const c of cards){
    try{
      const nameEl = c.querySelector('.product-name');
      if (nameEl && normalizeId(nameEl.textContent||'') === norm) return c;
    }catch(e){}
  }
  return null;
}

// Preview helpers: show/hide the preview tooltip created by ensureProductPreviewAndModal
function showPreviewForCard(card){
  if (!card) return;
  ensureProductPreviewAndModal();
  const preview = document.getElementById('productPreview');
  if (!preview) return;
  try{
    const img = card.dataset.image || card.querySelector('.product-img')?.src || '';
    const name = card.dataset.name || card.querySelector('.product-name')?.textContent || '';
    const priceRaw = card.dataset.price || card.querySelector('.product-price')?.textContent || '';
    const desc = card.dataset.shortdesc || card.querySelector('.product-description')?.textContent || '';
    const imgEl = document.getElementById('productPreviewImg');
    const nameEl = document.getElementById('productPreviewName');
    const priceEl = document.getElementById('productPreviewPrice');
    const descEl = document.getElementById('productPreviewDesc');
    if (imgEl) imgEl.src = img;
    if (nameEl) nameEl.textContent = name;
    if (priceEl) priceEl.textContent = `฿${formatCurrency(parsePrice(priceRaw))}`;
    if (descEl) descEl.textContent = desc;

    const rect = card.getBoundingClientRect();
    // prefer showing to the right of the card when space allows
    const left = Math.min(window.innerWidth - 300, rect.right + 10);
    const top = Math.max(8, rect.top);
    preview.style.left = left + 'px';
    preview.style.top = top + 'px';
    preview.style.display = 'block';
  }catch(e){ console.debug('showPreviewForCard error', e); }
}
function hidePreview(){ const p=document.getElementById('productPreview'); if(p) p.style.display='none'; }

// Initialize product preview and modal on DOMContentLoaded
document.addEventListener('DOMContentLoaded', ()=>{
  ensureProductPreviewAndModal();
});

// Product preview tooltip + full product modal
function ensureProductPreviewAndModal() {
  if (document.getElementById('productPreview')) return;

  // Preview (small tooltip near card)
  const preview = document.createElement('div');
  preview.id = 'productPreview';
  preview.style.cssText = 'position:fixed;z-index:12000;display:none;pointer-events:none;max-width:280px;background:rgba(34,28,30,0.98);color:#f5e9d6;border:1px solid rgba(191,161,74,0.12);padding:10px;border-radius:10px;box-shadow:0 8px 30px rgba(0,0,0,0.6);backdrop-filter:blur(4px);';
  preview.innerHTML = `
    <div style="display:flex;gap:10px;align-items:center">
      <img id="productPreviewImg" src="" style="width:64px;height:64px;object-fit:cover;border-radius:8px;flex:0 0 64px">
      <div style="flex:1">
        <div id="productPreviewName" style="color:#ffd86b;font-weight:700;margin-bottom:6px"></div>
        <div id="productPreviewPrice" style="color:#4ade80;font-weight:800"></div>
        <div id="productPreviewDesc" style="margin-top:6px;font-size:0.9rem;color:#dcd6c8;max-height:3.6rem;overflow:hidden"></div>
      </div>
    </div>
  `;
  document.body.appendChild(preview);

  // Full modal (centered)
  const modal = document.createElement('div');
  modal.id = 'productModal';
  modal.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.6);z-index:13000;padding:20px;';
  modal.innerHTML = `
    <div id="productModalContent" style="background:#231c24;color:#f5e9d6;border-radius:14px;max-width:900px;width:100%;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,0.6);position:relative;">
      <button id="productModalClose" style="position:absolute;right:14px;top:10px;background:none;border:none;color:#f5e9d6;font-size:28px;cursor:pointer">&times;</button>
      <div style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">
        <img id="productModalImg" src="" style="width:260px;height:260px;object-fit:cover;border-radius:10px;flex:0 0 260px">
        <div style="flex:1;min-width:240px">
          <h2 id="productModalName" style="color:#ffd86b;margin:0 0 8px 0"></h2>
          <div id="productModalPrice" style="color:#4ade80;font-weight:800;margin-bottom:12px"></div>
          <p id="productModalDesc" style="color:#dcd6c8;line-height:1.5;margin-bottom:12px"></p>

          <!-- Rich details area -->
          <div id="productModalRich" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px">
            <div id="productModalIngredientsRow" style="display:none"><strong style="color:#ffd86b">ส่วนประกอบ:</strong> <span id="productModalIngredients" style="margin-left:6px;color:#dcd6c8"></span></div>
            <div id="productModalMaterialRow" style="display:none"><strong style="color:#ffd86b">วัสดุ:</strong> <span id="productModalMaterial" style="margin-left:6px;color:#dcd6c8"></span></div>
            <div id="productModalSizesRow" style="display:none"><strong style="color:#ffd86b">ขนาดที่มี:</strong> <span id="productModalSizes" style="margin-left:6px;color:#dcd6c8"></span></div>
            <div id="productModalColorRow" style="display:none"><strong style="color:#ffd86b">สีที่มี:</strong> <span id="productModalColor" style="margin-left:6px;color:#dcd6c8"></span></div>
            <div id="productModalFitRow" style="display:none"><strong style="color:#ffd86b">รูปแบบการสวมใส่:</strong> <span id="productModalFit" style="margin-left:6px;color:#dcd6c8"></span></div>
            <div id="productModalCareRow" style="display:none"><strong style="color:#ffd86b">การดูแล:</strong> <span id="productModalCare" style="margin-left:6px;color:#dcd6c8"></span></div>
            <div id="productModalCaloriesRow" style="display:none"><strong style="color:#ffd86b">น้ำหนัก (U):</strong> <span id="productModalCalories" style="margin-left:6px;color:#dcd6c8"></span></div>
            <div id="productModalSizeRow" style="display:none"><strong style="color:#ffd86b">ความตึง (lbs):</strong> <span id="productModalSize" style="margin-left:6px;color:#dcd6c8"></span></div>
            <div id="productModalRatingRow" style="display:none"><strong style="color:#ffd86b">คะแนนรีวิว:</strong> <span id="productModalRating" style="margin-left:6px;color:#dcd6c8"></span></div>
            <div id="productModalSKURow" style="display:none"><strong style="color:#ffd86b">รหัสสินค้า:</strong> <span id="productModalSKU" style="margin-left:6px;color:#dcd6c8"></span></div>
          </div>

          <div id="productModalTags" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px"></div>
          <div style="display:flex;gap:10px;align-items:center">
            <div class="quantity-controls" style="margin:0">
              <button class="qty-btn minus" id="productModalMinus">-</button>
              <span class="quantity" id="productModalQty">1</span>
              <button class="qty-btn plus" id="productModalPlus">+</button>
            </div>
            <button id="productModalAdd" class="add-to-cart-btn" style="padding:10px 18px">เพิ่มลงตะกร้า</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close handlers
  modal.querySelector('#productModalClose').addEventListener('click', closeProductModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeProductModal(); });

  // Add button handlers inside modal
  const minus = document.getElementById('productModalMinus');
  const plus = document.getElementById('productModalPlus');
  const qtySpan = document.getElementById('productModalQty');
  minus.addEventListener('click', ()=>{ const v = Math.max(1, parseInt(qtySpan.textContent||'1') - 1); qtySpan.textContent = v; });
  plus.addEventListener('click', ()=>{ const v = Math.max(1, parseInt(qtySpan.textContent||'1') + 1); qtySpan.textContent = v; });
  document.getElementById('productModalAdd').addEventListener('click', ()=>{
    const id = modal.dataset.pid; if(!id) return;
    const name = modal.dataset.pname || document.getElementById('productModalName').textContent;
    const price = Number(modal.dataset.pprice || (document.getElementById('productModalPrice').textContent.replace(/[^0-9.-]+/g,'')||0));
    const image = modal.dataset.pimage || document.getElementById('productModalImg').src;
    const qty = parseInt(document.getElementById('productModalQty').textContent||'1');
    // set modal qty to quantities state then call addToCart
    quantities[id] = qty;
    const el = document.getElementById(`${id}-qty`);
    if (el) el.textContent = qty;
    addToCart(id, name, price, image);
    closeProductModal();
  });
}

function openProductModal(productId){
  ensureProductPreviewAndModal();
  const modal = document.getElementById('productModal');
  const card = findProductCard(productId);
  if (!card) return;
  const image = card.dataset.image || card.querySelector('.product-img')?.src || '';
  const title = card.dataset.name || card.querySelector('.product-name')?.textContent || '';
  // prefer visible price text; fall back to data-price
  const domPriceRaw = card.querySelector('.product-price')?.textContent || '';
  const dataPriceRaw = card.dataset.price || '';
  let priceNumber = parsePrice(domPriceRaw);
  if (!priceNumber) priceNumber = parsePrice(dataPriceRaw);
  // final fallback to 0
  priceNumber = priceNumber || 0;
  const desc = card.dataset.fulldesc || card.querySelector('.product-description')?.textContent || '';
  const tags = Array.from(card.querySelectorAll('.tag')).map(t=>t.textContent.trim());

  // rich fields from data- attributes (optional)
  const ingredients = card.dataset.ingredients || '';
  const calories = card.dataset.calories || '';
  const size = card.dataset.size || '';
  const allergens = card.dataset.allergens || '';
  const prep = card.dataset.preptime || '';
  const rating = card.dataset.rating || '';
  const sku = card.dataset.sku || '';
  // new fashion-oriented fields
  const material = card.dataset.material || '';
  const sizesAvailable = card.dataset.sizes || '';
  const color = card.dataset.color || '';
  const fit = card.dataset.fit || '';
  const care = card.dataset.care || '';

  modal.dataset.pid = productId;
  modal.dataset.pname = title;
  modal.dataset.pprice = priceNumber;
  modal.dataset.pimage = image;

  document.getElementById('productModalImg').src = image;
  document.getElementById('productModalName').textContent = title;
  document.getElementById('productModalPrice').textContent = `฿${formatCurrency(priceNumber)}`;
  document.getElementById('productModalDesc').textContent = desc;

  // populate rich fields and show/hide rows
  const setRow = (rowId, val, fieldId)=>{
    const row = document.getElementById(rowId);
    const f = document.getElementById(fieldId);
    if(row && f){ if(val && String(val).trim()!==''){ row.style.display='block'; f.textContent = val; } else { row.style.display='none'; f.textContent = ''; } }
  }
  // detect fashion items by presence of material (we added data-material for fashion)
  const isFashion = !!material;
  setRow('productModalIngredientsRow', ingredients, 'productModalIngredients');
  setRow('productModalMaterialRow', material, 'productModalMaterial');
  setRow('productModalSizesRow', sizesAvailable, 'productModalSizes');
  setRow('productModalColorRow', color, 'productModalColor');
  setRow('productModalFitRow', fit, 'productModalFit');
  setRow('productModalCareRow', care, 'productModalCare');
  // show allergens/prep for equipment; calories/size (weight/tension) only for non-fashion
  setRow('productModalAllergensRow', allergens, 'productModalAllergens');
  setRow('productModalPrepRow', prep, 'productModalPrep');
  setRow('productModalCaloriesRow', isFashion ? '' : calories, 'productModalCalories');
  setRow('productModalSizeRow', isFashion ? '' : size, 'productModalSize');
  setRow('productModalRatingRow', rating, 'productModalRating');
  setRow('productModalSKURow', sku, 'productModalSKU');

  const tagWrap = document.getElementById('productModalTags'); tagWrap.innerHTML = '';
  tags.forEach(t=>{ const s = document.createElement('span'); s.className='tag category'; s.style.marginRight='6px'; s.textContent = t; tagWrap.appendChild(s); });
  document.getElementById('productModalQty').textContent = (quantities[productId] && quantities[productId]>0) ? quantities[productId] : 1;

  modal.style.display = 'flex';
}
function closeProductModal(){ const m=document.getElementById('productModal'); if(m) m.style.display='none'; }

// Attach hover/click handlers to product cards
function attachProductCardHandlers(){
  document.querySelectorAll('.product-card').forEach(card=>{
    card.addEventListener('mouseenter', ()=> showPreviewForCard(card));
    card.addEventListener('mouseleave', ()=> hidePreview());
    card.addEventListener('click', (e)=>{
      // ignore clicks on qty/add buttons inside card
      if (e.target.closest('.qty-btn') || e.target.closest('.add-to-cart-btn') || e.target.closest('.cart-qty-btn')) return;
      const id = card.dataset.id; if (id) openProductModal(id);
    });
  });
}

// wire into initialization
document.addEventListener('DOMContentLoaded', ()=>{
  // ...existing DOMContentLoaded work above already runs; attach handlers here as well
  setTimeout(attachProductCardHandlers, 60);
});

// expose for debugging
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.showPreviewForCard = showPreviewForCard;
window.hidePreview = hidePreview;

// Expose some functions to global scope (so inline onclick works)
window.updateQuantity = updateQuantity;
window.addToCart = addToCart;
window.toggleCart = toggleCart;
window.showCheckoutTab = showCheckoutTab;
window.showCartTab = showCartTab;
window.placeOrder = placeOrder;
window.clearCart = clearCart;
window.openOrderDetailsModal = openOrderDetailsModal;
window.closeOrderDetailsModal = closeOrderDetailsModal;
window.closeOrderSuccessModal = closeOrderSuccessModal;
window.showStatistics = showStatistics;
window.closeStatistics = closeStatistics;
window.resetStatistics = resetStatistics;
window.exportStatistics = exportStatistics;
// expose cart helpers too
window.updateCartItem = updateCartItem;
window.removeFromCart = removeFromCart;
window.renderOrderCountsOnProducts = renderOrderCountsOnProducts;

// End of file
