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
    // 1. Učitaj osnovni izgled (Meni i Footer)
    loadLayout(); 

    // 2. Ako smo na stranici korpe, moramo prvo imati proizvode da bismo znali cene
    const cartContainer = document.getElementById('cart-table-container');
    if (cartContainer) {
        fetch('data/products.json')
            .then(res => res.json())
            .then(data => {
                allProducts = data.products; 
                renderFullCart();           
            })
            .catch(err => console.error("Greška pri učitavanju proizvoda za korpu:", err));
    }

    // 3. Ostale inicijalizacije
    initFeaturedProducts(); 
    initAllProducts();      
    initNewsletterForm();
    initContactForm();
    initGlobalEvents();     
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

    html += `
        <li class="cart-li">
            <a href="#" id="open-cart-btn" class="nav-link cart-icon-anchor">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cart-svg">
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
        container.innerHTML = '<p class="text-center">Nema proizvoda za prikaz.</p>';
    } else {
        container.innerHTML = toShow.map(p => createProductCard(p)).join('');
    }

    if (btnLoadMore) {
    if (visibleCount < filteredProducts.length) {
        btnLoadMore.classList.add('active'); 
    } else {
        btnLoadMore.classList.remove('active');
    }
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

    if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sort === 'name-asc') result.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'name-desc') result.sort((a, b) => b.name.localeCompare(a.name));

    filteredProducts = result;
    visibleCount = INITIAL_COUNT; 
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
    const btnLoadMore = document.getElementById('btn-load-more');
    if (btnLoadMore) {
        btnLoadMore.addEventListener('click', () => {
            visibleCount += LOAD_MORE_STEP;
            displayProducts('all-products');
        });
    }

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

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (countSpan) {
        countSpan.textContent = totalItems;
        if (totalItems > 0) countSpan.classList.add('active');
        else countSpan.classList.remove('active');
    }

    if (miniCartContainer) {
        if (cart.length === 0) {
            miniCartContainer.innerHTML = '<p class="text-center">Korpa je prazna.</p>';
            if(totalSpan) totalSpan.textContent = '0 RSD';
        } else {
            let total = 0;
            miniCartContainer.innerHTML = cart.map(item => {
                total += item.price * item.quantity;
                return `
                    <div class="cart-item-mini">
                        <img src="${item.image}" alt="${item.name}" class="cart-img-mini">
                        <div class="cart-item-info">
                            <h4>${item.name}</h4>
                            <p class="price-font">${formatPrice(item.price)}</p>
                        </div>
                        <div class="cart-item-actions">
                            <div class="qty-mini">
                                <button class="btn-qty-mini" onclick="changeQuantity(${item.id}, -1)">-</button>
                                <span>${item.quantity}</span>
                                <button class="btn-qty-mini" onclick="changeQuantity(${item.id}, 1)">+</button>
                            </div>
                            <button class="btn-remove-mini" onclick="removeFromCart(${item.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>`;
            }).join('');
            if(totalSpan) totalSpan.textContent = formatPrice(total);
        }
    }
}

function showMiniCart() {
    document.getElementById('cart-drawer').classList.add('active');
    document.getElementById('cart-overlay').classList.add('active');
    updateCartUI();
}

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
        if (existing.quantity < 5) existing.quantity++;
        else return; 
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
    showMiniCart();
}

function changeQuantity(id, delta) {
    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    const product = cart.find(item => item.id === id);

    if (product) {
        const newQuantity = product.quantity + delta;
        if (newQuantity >= 1 && newQuantity <= 5) {
            product.quantity = newQuantity;
        } else {
            return;
        }
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
    if (typeof renderFullCart === "function") renderFullCart();
}

function removeFromCart(id) {
    let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
    cart = cart.filter(item => item.id !== id);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartUI();
    if (typeof renderFullCart === "function") renderFullCart();
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
    const msgBox = document.getElementById('form-message');
    if (!form || !msgBox) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        msgBox.className = "form-message"; 

        if (isValidEmail(email)) {
            msgBox.textContent = "Poruka uspešno poslata!";
            msgBox.classList.add('active', 'success');
            form.reset();
        } else {
            msgBox.textContent = "Neispravan email.";
            msgBox.classList.add('active', 'error');
        }
        setTimeout(() => msgBox.classList.remove('active'), 4000);
    });
}

function initNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    const msgBox = document.getElementById('newsletter-msg');
    
    if (form && msgBox) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = document.getElementById('newsletter-email');
            const emailValue = emailInput.value.trim();

            msgBox.className = "newsletter-msg"; 

            if (isValidEmail(emailValue)) {
                msgBox.textContent = "Uspešno ste se prijavili na našu listu!";
                msgBox.classList.add('active', 'success');
                emailInput.value = "";
            } else {
                msgBox.textContent = "Molimo unesite ispravnu email adresu.";
                msgBox.classList.add('active', 'error');
            }

            setTimeout(() => {
                msgBox.classList.remove('active');
            }, 4000);
        });
    }
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ========================================
// 8. LOGIKA ZA KORPA.HTML
// ========================================
function renderFullCart() {
    const container = document.getElementById('cart-table-container');
    if (!container) return;

    const cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center cart-empty-msg">
                <p>Vaša korpa je trenutno prazna.</p>
                <a href="proizvodi.html" class="btn btn-primary">Idi u prodavnicu</a>
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
            <tbody>`;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        html += `
            <tr>
                <td class="cart-product-cell">
                    <img src="${item.image}" alt="${item.name}" class="cart-img">
                    <span class="cart-product-name">${item.name}</span>
                </td>
                <td class="price-font">${formatPrice(item.price)}</td>
                <td>
                    <div class="qty-controls">
                        <button class="btn-qty" onclick="changeQuantity(${item.id}, -1)">-</button>
                        <span class="qty-number">${item.quantity}</span>
                        <button class="btn-qty" onclick="changeQuantity(${item.id}, 1)">+</button>
                    </div>
                </td>
                <td class="price-font">${formatPrice(itemTotal)}</td>
                <td>
                    <button class="btn-remove" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>`;
    });

    html += `
            </tbody>
        </table>
        <div class="cart-summary">
            <h2 class="price-font">Ukupno: ${formatPrice(total)}</h2>
            <button onclick="processOrder()" class="btn btn-primary btn-checkout">ZAVRŠI KUPOVINU</button>
        </div>`;

    container.innerHTML = html;
}

function processOrder() {
    const container = document.getElementById('cart-table-container');
    if (container) container.classList.add('hidden'); // Dodaj .hidden u CSS (display: none)
    
    const msg = document.getElementById('order-success-msg');
    if (msg) msg.classList.add('active'); // .active u CSS (display: block)

    localStorage.removeItem(CART_KEY);
    updateCartUI();
}