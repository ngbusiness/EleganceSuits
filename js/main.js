// ========================================
// 1. KONSTANTE I GLOBALNO STANJE
// ========================================
const INITIAL_COUNT = 4;
const LOAD_MORE_STEP = 8;
const CART_KEY = 'elegance_suits_cart';

let allProducts = [];      // Svi proizvodi iz JSON-a
let filteredProducts = []; // Proizvodi nakon filtera/pretrage
let visibleCount = INITIAL_COUNT;

// ========================================
// 2. INICIJALIZACIJA (DOMContentLoaded)
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    loadLayout(); 
    initFeaturedProducts(); // Za index.html
    initAllProducts();      // Za proizvodi.html
    initNewsletterForm();
    initContactForm();
    initGlobalEvents();     // Klikovi na korpu i load more
});

// ========================================
// 3. DINAMIČKI LAYOUT (Header & Footer)
// ========================================
function loadLayout() {
    fetch('data/menu.json')
        .then(res => res.json())
        .then(data => {
            renderHeader(data.navigation);
            renderFooter(data.footer);
            initNavigation(); 
        })
        .catch(err => console.error("Greška pri učitavanju layout-a:", err));
}

function renderHeader(links) {
    const navMenu = document.querySelector(".nav-menu");
    if (!navMenu) return;
    
    let html = links.map(link => `
        <li><a href="${link.url}" class="nav-link">${link.name}</a></li>
    `).join('');

    // Dodajemo ikonicu korpe (SVG) sa brojačem
    html += `
        <li class="cart-li">
            <a href="#" id="open-cart-btn" class="nav-link cart-icon-anchor">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="9" cy="21" r="1"></circle>
                    <circle cx="20" cy="21" r="1"></circle>
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
                <span id="cart-count">0</span>
            </a>
        </li>
    `;
    navMenu.innerHTML = html;
    updateCartUI(); 
}

function renderFooter(footerData) {
    const grid = document.getElementById("footer-main-grid");
    const bottom = document.getElementById("footer-copy-space");
    if (!grid || !bottom) return;

    let html = `
        <div class="footer-col">
            <h3 class="footer-logo">${footerData.about.title}</h3>
            <p>${footerData.about.text}</p>
        </div>`;

    footerData.columns.forEach(col => {
        html += `
            <div class="footer-col">
                <h4>${col.title}</h4>
                <ul>${col.links.map(l => `<li><a href="${l.url}">${l.name}</a></li>`).join('')}</ul>
            </div>`;
    });

    const c = footerData.contact;
    html += `
        <div class="footer-col">
            <h4>${c.title}</h4>
            <p>${c.address}, ${c.city}</p>
            <p>Tel: ${c.phone}</p>
            <p>Email: ${c.email}</p>
        </div>`;

    grid.innerHTML = html;
    bottom.innerHTML = `<p>${footerData.copyright}</p>`;
}

// ========================================
// 4. LOGIKA PROIZVODA (Helper funkcije)
// ========================================
function createProductCard(product) {
    const oldPriceHtml = product.oldPrice ? `<span class="old-price">${formatPrice(product.oldPrice)}</span>` : '';
    return `
        <article class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                ${product.badge ? `<span class="product-badge">${product.badge}</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${oldPriceHtml} ${formatPrice(product.price)}</p>
                <button class="btn-add-to-cart" data-id="${product.id}">Dodaj u korpu</button>
            </div>
        </article>
    `;
}

function formatPrice(price) {
    return price.toLocaleString('sr-RS') + ' RSD';
}

function displayProducts(containerId) {
    const container = document.getElementById(containerId);
    const btnLoadMore = document.getElementById('btn-load-more');
    if (!container) return;

    const toShow = filteredProducts.slice(0, visibleCount);
    
    if (toShow.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center;">Nema proizvoda za prikaz.</p>';
    } else {
        container.innerHTML = toShow.map(p => createProductCard(p)).join('');
    }

    // Load more dugme logika
    if (btnLoadMore) {
        btnLoadMore.style.display = (visibleCount < filteredProducts.length) ? 'inline-block' : 'none';
    }
}

// ========================================
// 5. STRANICA PROIZVODI (Filteri i Paginacija)
// ========================================
function initAllProducts() {
    const container = document.getElementById('all-products');
    if (!container) return;

    fetch('data/products.json')
        .then(res => res.json())
        .then(data => {
            allProducts = data.products;
            filteredProducts = [...allProducts];
            populateCategories(data.categories);
            displayProducts('all-products');
            setupFilterListeners();
        })
        .catch(err => console.error("Greška:", err));
}

function setupFilterListeners() {
    const filters = ['category-filter', 'sort-filter', 'search-input'];
    const searchBtn = document.getElementById('search-btn');

    filters.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', applyFilters);
    });

    if (searchBtn) searchBtn.addEventListener('click', applyFilters);
}

function applyFilters() {
    const cat = document.getElementById('category-filter')?.value || 'sve';
    const sort = document.getElementById('sort-filter')?.value || 'default';
    const search = document.getElementById('search-input')?.value.toLowerCase().trim() || '';

    let result = allProducts.filter(p => {
        const matchCat = cat === 'sve' || p.category === cat;
        const matchSearch = p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search);
        return matchCat && matchSearch;
    });

    // Sortiranje
    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sort === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name-desc') result.sort((a, b) => b.name.localeCompare(a.name));

    filteredProducts = result;
    visibleCount = INITIAL_COUNT; // Resetujemo paginaciju na filter
    displayProducts('all-products');
}

function populateCategories(categories) {
    const select = document.getElementById('category-filter');
    if (!select) return;
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        select.appendChild(opt);
    });
}

// ========================================
// 6. EVENTI (Korpa i Load More)
// ========================================
function initGlobalEvents() {
    // Load More dugme
    const btnLoadMore = document.getElementById('btn-load-more');
    if (btnLoadMore) {
        btnLoadMore.addEventListener('click', () => {
            visibleCount += LOAD_MORE_STEP;
            displayProducts('all-products');
        });
    }

    // Korpa (Event Delegation)
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-add-to-cart')) {
            const id = parseInt(e.target.dataset.id);
            addToCart(id);
        }
    });
}

function updateCartUI() {
    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const countSpan = document.getElementById('cart-count');
    const miniCartContainer = document.getElementById('mini-cart-items');
    const totalSpan = document.getElementById('mini-cart-total');

    // 1. Brojač u navbaru
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (countSpan) {
        countSpan.textContent = totalItems;
        countSpan.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }

    // 2. Lista u Draweru
    if (miniCartContainer) {
        if (cart.length === 0) {
            miniCartContainer.innerHTML = '<p>Korpa je prazna.</p>';
            if(totalSpan) totalSpan.textContent = '0 RSD';
        } else {
            let total = 0;
            // Unutar updateCartUI funkcije, deo gde se mapira korpa:
miniCartContainer.innerHTML = cart.map(item => {
    total += item.price * item.quantity;
    return `
        <div class="cart-item-mini" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:10px;">
            <div style="display:flex; gap:10px; align-items:center;">
                <img src="${item.image}" width="40" height="50" style="object-fit:cover;">
                <div>
                    <h4 style="font-size:0.85rem; margin:0;">${item.name}</h4>
                    <p style="font-size:0.8rem; margin:0;">${item.price} RSD</p>
                </div>
            </div>
            
            <div style="display:flex; flex-direction:column; align-items:flex-end; gap:5px;">
                <div style="display:flex; align-items:center; gap:8px; background:#f4f4f4; border-radius:4px; padding:2px 5px;">
                    <button onclick="changeQuantity(${item.id}, -1)" style="border:none; background:none; cursor:pointer; font-weight:bold;">-</button>
                    <span style="font-size:0.9rem; font-weight:bold;">${item.quantity}</span>
                    <button onclick="changeQuantity(${item.id}, 1)" style="border:none; background:none; cursor:pointer; font-weight:bold;">+</button>
                </div>
                <button onclick="removeFromCart(${item.id})" style="border:none; background:none; color:#e74c3c; cursor:pointer; font-size:0.8rem;">
                    <i class="fas fa-trash"></i> Ukloni
                </button>
            </div>
        </div>
    `;
}).join('');
            if(totalSpan) totalSpan.textContent = total.toLocaleString() + ' RSD';
        }
    }
}

// Funkcije za otvaranje i zatvaranje
function showMiniCart() {
    document.getElementById('cart-drawer').classList.add('active');
    document.getElementById('cart-overlay').classList.add('active');
    updateCartUI();
}

// Event listeneri
document.addEventListener('click', (e) => {
    if (e.target.closest('#open-cart-btn')) {
        e.preventDefault();
        showMiniCart();
    }
    if (e.target.id === 'close-cart' || e.target.id === 'cart-overlay') {
        document.getElementById('cart-drawer').classList.remove('active');
        document.getElementById('cart-overlay').classList.remove('active');
    }
});

function addToCart(id) {
    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const product = allProducts.find(p => p.id === id);
    
    if (!product) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        if (existing.quantity < 5) {
            existing.quantity++;
        } else {
            // Umesto alerta, možemo samo da ignorišemo ili ispišemo u konzoli
            console.log("Dostignut limit za ovaj proizvod.");
            return; 
        }
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
    showMiniCart();
}

// Funkcija za promenu količine (+ ili -)
function changeQuantity(id, delta) {
    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const product = cart.find(item => item.id === id);

    if (product) {
        const newQuantity = product.quantity + delta;

        // Provera: Min 1, Max 5
        if (newQuantity >= 1 && newQuantity <= 5) {
            product.quantity = newQuantity;
        } else if (newQuantity < 1) {
            // Ako padne ispod 1, opcionalno možemo i da obrišemo, 
            // ali je bolje da ostavimo na 1 ili da korisnik klikne X
            return; 
        } else if (newQuantity > 5) {
            // Ovde možeš dodati neki diskretan tekst umesto alerta ako hoćeš
            console.log("Maksimalna količina je 5");
            return;
        }
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
    
    // Ako smo na stranici korpa.html, osveži i veliku tabelu
    if (typeof renderFullCart === "function") {
        renderFullCart();
    }
}

// Funkcija za potpuno uklanjanje proizvoda
function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    cart = cart.filter(item => item.id !== id);
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
    
    if (typeof renderFullCart === "function") {
        renderFullCart();
    }
}
// ========================================
// 7. OSTALE FUNKCIJE (Forme & Nav)
// ========================================
function initFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    fetch('data/products.json')
        .then(res => res.json())
        .then(data => {
            const featured = data.products.filter(p => p.featured);
            container.innerHTML = featured.map(p => createProductCard(p)).join('');
        });
}

function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => navMenu.classList.toggle('active'));
    }
}

function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        if (isValidEmail(email)) {
            showFormMessage('success', 'Poruka uspešno poslata!');
            form.reset();
        } else {
            showFormMessage('error', 'Neispravan email.');
        }
    });
}

function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = form.querySelector('input').value;
        if (isValidEmail(email)) alert('Uspešna prijava!');
    });
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFormMessage(type, msg) {
    const el = document.getElementById('form-message');
    if (!el) return;
    el.className = `form-message ${type}`;
    el.textContent = msg;
    el.style.display = 'block';
    setTimeout(() => el.style.display = 'none', 4000);
}
// Logika za korpa.html
function renderFullCart() {
    const container = document.getElementById('cart-table-container');
    if (!container) return;

    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center">
                <p>Vaša korpa je trenutno prazna.</p>
                <a href="proizvodi.html" class="btn-load-more" style="display:inline-block; margin-top:20px;">Idi u prodavnicu</a>
            </div>`;
        return;
    }

    let total = 0;
    let html = `
        <table class="cart-table">
            <thead>
                <tr>
                    <th>Proizvod</th>
                    <th>Cena</th>
                    <th>Količina</th>
                    <th>Ukupno</th>
                    <th>Ukloni</th>
                </tr>
            </thead>
            <tbody>
    `;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <tr>
                <td style="display:flex; align-items:center; gap:20px;">
                    <img src="${item.image}" alt="${item.name}" class="cart-img">
                    <strong>${item.name}</strong>
                </td>
                <td>${formatPrice(item.price)}</td>
                <td>
                    <div class="qty-controls">
                        <button class="btn-qty" onclick="changeQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="btn-qty" onclick="changeQuantity(${item.id}, 1)">+</button>
                    </div>
                </td>
                <td>${formatPrice(itemTotal)}</td>
                <td>
                    <button class="btn-remove" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
        <div class="cart-summary">
            <h2>Ukupno: ${formatPrice(total)}</h2>
            <button onclick="processOrder()" class="btn-load-more" style="width: 100%; max-width: 300px;">ZAVRŠI KUPOVINU</button>
        </div>
    `;

    container.innerHTML = html;
}

// Funkcija za uklanjanje jednog artikla
function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderFullCart();
    updateCartUI();
}

// Finalni Checkout - Čišćenje korpe i poruka
function processOrder() {
    // 1. Sakrij tabelu
    document.getElementById('cart-table-container').style.display = 'none';
    
    // 2. Prikaži zelenu poruku
    const msg = document.getElementById('order-success-msg');
    if (msg) msg.style.display = 'block';

    // 3. Obriši korpu iz memorije
    localStorage.removeItem(CART_KEY);
    
    // 4. Resetuj broj u navbaru
    updateCartUI();
}