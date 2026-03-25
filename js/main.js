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
    const currentPath = window.location.pathname;
    navMenu.innerHTML = links.map(link => `
        <li><a href="${link.url}" class="nav-link ${currentPath.includes(link.url) ? "active" : ""}">${link.name}</a></li>
    `).join('');
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

function addToCart(id) {
    try {
        let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
        const product = allProducts.find(p => p.id === id);
        if (!product) return;

        const existing = cart.find(item => item.id === id);
        if (existing) existing.quantity++;
        else cart.push({ ...product, quantity: 1 });

        localStorage.setItem(CART_KEY, JSON.stringify(cart));
        alert(`Odelo "${product.name}" je dodato u korpu!`);
    } catch (err) {
        console.error("LocalStorage greška:", err);
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