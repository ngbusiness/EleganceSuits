// DOM Sadrzaj se ucitava
document.addEventListener('DOMContentLoaded', function() {
    loadLayout(); // Učitavanje headera i footera
    initFeaturedProducts();
    initNewsletterForm();
    initContactForm();
    initAllProducts();
});

// Dinamičko učitavanje headera i footera
function loadLayout() {
    fetch('data/menu.json')
        .then(res => res.json())
        .then(data => {
            renderHeader(data.navigation);
            renderFooter(data.footer);
            
            // Inicijalizacija navigacije nakon što se HTML generiše
            initNavigation(); 
        })
        .catch(err => console.error("Greška:", err));
}

function renderHeader(links) {
    const navMenu = document.querySelector(".nav-menu");
    if (!navMenu) return;

    const currentPath = window.location.pathname;
    let html = "";
    links.forEach(link => {
        const isActive = currentPath.includes(link.url) ? "active" : "";
        html += `<li><a href="${link.url}" class="nav-link ${isActive}">${link.name}</a></li>`;
    });
    navMenu.innerHTML = html;
}

function renderFooter(footerData) {
    // Selektujemo footer-grid jer on drži CSS raspored za kolone
    const footerGrid = document.querySelector(".footer-grid");
    // Selektujemo container za copyright jer on ide van grida
    const footerContainer = document.querySelector(".footer .container");
    
    if (!footerGrid || !footerContainer) return;

    let html = "";

    // 1. Kolona: O nama
    html += `
        <div class="footer-col">
            <h4>${footerData.about.title}</h4>
            <p>${footerData.about.text}</p>
        </div>`;

    // 2. i 3. Kolona: Navigacija i Informacije
    footerData.columns.forEach(col => {
        html += `
            <div class="footer-col">
                <h4>${col.title}</h4>
                <ul>
                    ${col.links.map(l => `<li><a href="${l.url}">${l.name}</a></li>`).join('')}
                </ul>
            </div>`;
    });

    // 4. Kolona: Kontakt
    const c = footerData.contact;
    html += `
        <div class="footer-col">
            <h4>${c.title}</h4>
            <p>${c.address}</p>
            <p>${c.city}</p>
            <p>Tel: ${c.phone}</p>
            <p>Email: ${c.email}</p>
        </div>`;

    // Ubacujemo kolone u GRID (ovo popravlja vizuelni deo)
    footerGrid.innerHTML = html;

    // Proveravamo da li footer-bottom već postoji da ga ne bismo duplirali
    let footerBottom = document.querySelector(".footer-bottom");
    if (!footerBottom) {
        footerBottom = document.createElement("div");
        footerBottom.className = "footer-bottom";
        footerContainer.appendChild(footerBottom);
    }
    
    footerBottom.innerHTML = `<p>${footerData.copyright}</p>`;
}

// Navigacija
function initNavigation() {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
        
        
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
            });
        });
        
        
        document.addEventListener('click', function(e) {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
            }
        });
    }
}

// Proizvodi
function initFeaturedProducts() {
    const featuredContainer = document.getElementById('featured-products');
    
    if (featuredContainer) {
        loadFeaturedProducts(featuredContainer);
    }
}

function loadFeaturedProducts(container) {
    
    container.innerHTML = `
        <div class="loading" style="grid-column: 1 / -1;">
            <div class="spinner"></div>
            <p>Učitavanje proizvoda...</p>
        </div>
    `;
    
    // Ajax
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'data/products.json', true);
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    const featuredProducts = data.products.filter(product => product.featured);
                    displayProducts(featuredProducts, container);
                } catch (error) {
                    container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Greška pri učitavanju podataka.</p>';
                    console.error('JSON parsing error:', error);
                }
            } else {
                container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Greška pri učitavanju proizvoda.</p>';
            }
        }
    };
    
    xhr.onerror = function() {
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Greška pri povezivanju sa serverom.</p>';
    };
    
    xhr.send();
}

/* Prikazi proizvode
*/
function displayProducts(products, container) {
    if (products.length === 0) {
        container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Nema proizvoda za prikaz.</p>';
        return;
    }
    
    let html = '';
    
    products.forEach(product => {
        html += createProductCard(product);
    });
    
    container.innerHTML = html;
}

function createProductCard(product) {
    const badgeHtml = product.badge ? `<span class="product-badge">${product.badge}</span>` : '';
    const priceHtml = product.oldPrice 
        ? `<span class="old-price">${formatPrice(product.oldPrice)}</span> ${formatPrice(product.price)}`
        : formatPrice(product.price);
    
    return `
        <article class="product-card">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
                ${badgeHtml}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-price">${priceHtml}</p>
            </div>
        </article>
    `;
}

function formatPrice(price) {
    return price.toLocaleString('sr-RS') + ' RSD';
}

/* Svi proizvodi
*/
function initAllProducts() {
    const productsContainer = document.getElementById('all-products');
    const categoryFilter = document.getElementById('category-filter');
    const sortFilter = document.getElementById('sort-filter');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    let allProducts = [];
    let filteredProducts = [];
    
    // Ucitaj sve proizvode
    if (productsContainer) {
        loadAllProducts();
    }
    
    function loadAllProducts() {
        productsContainer.innerHTML = `
            <div class="loading" style="grid-column: 1 / -1;">
                <div class="spinner"></div>
                <p>Učitavanje proizvoda...</p>
            </div>
        `;
        
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'data/products.json', true);
        
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    allProducts = data.products;
                    filteredProducts = [...allProducts];
                    displayProducts(filteredProducts, productsContainer);
                    populateCategories(data.categories);
                } catch (error) {
                    productsContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center;">Greška pri učitavanju podataka.</p>';
                }
            }
        };
        
        xhr.send();
    }
    
    function populateCategories(categories) {
        if (categoryFilter) {
            categories.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.id;
                option.textContent = cat.name;
                categoryFilter.appendChild(option);
            });
        }
    }
    
    // Filter po kategoriji
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            applyFilters();
        });
    }
    
    // Sortiranje proizvoda
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            applyFilters();
        });
    }
    
    // Funkcionalnost pretrage
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            applyFilters();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
    
    function applyFilters() {
        let result = [...allProducts];
        
        // Filter kategorije
        const category = categoryFilter ? categoryFilter.value : 'sve';
        if (category !== 'sve') {
            result = result.filter(p => p.category === category);
        }
        
        // Filter pretrage
        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
        if (searchTerm) {
            result = result.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm)
            );
        }
        
        // Sortiranje
        const sortValue = sortFilter ? sortFilter.value : 'default';
        switch (sortValue) {
            case 'price-asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'name-asc':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                result.sort((a, b) => b.name.localeCompare(a.name));
                break;
        }
        
        filteredProducts = result;
        displayProducts(filteredProducts, productsContainer);
    }
}

// Kontakt forma

function initContactForm() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };
            
            // Validacija forme
            if (validateForm(formData)) {
                showFormMessage('success', 'Vaša poruka je uspešno poslata! Odgovorićemo vam u najkraćem roku.');
                contactForm.reset();
            }
        });
    }
}

function validateForm(data) {
    const messageContainer = document.getElementById('form-message');
    
    // Validacija imena
    if (!data.name || data.name.length < 2) {
        showFormMessage('error', 'Molimo unesite vaše ime (minimum 2 karaktera).');
        return false;
    }
    
    // Validacija email adrese
    if (!isValidEmail(data.email)) {
        showFormMessage('error', 'Molimo unesite validnu email adresu.');
        return false;
    }

    
    const phoneRegex = /^(\+381|0)6[0-9][0-9]{6,7}$/; 
    
    if (!data.phone || !phoneRegex.test(data.phone.replace(/\s/g, ''))) {
        showFormMessage('error', 'Broj telefona nije u ispravnom formatu (dozvoljeni su samo brojevi).');
        return false;
    }
    
    // Validacija poruke
    if (!data.message || data.message.length < 10) {
        showFormMessage('error', 'Molimo unesite vašu poruku (minimum 10 karaktera).');
        return false;
    }
    
    return true;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showFormMessage(type, message) {
    const messageContainer = document.getElementById('form-message');
    if (messageContainer) {
        messageContainer.className = 'form-message ' + type;
        messageContainer.textContent = message;
        messageContainer.style.display = 'block';
        
        // Sakrivanje poruke nakon 5s
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);
    }
}

// Forma za novine

function initNewsletterForm() {
    const newsletterForm = document.getElementById('newsletter-form');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = newsletterForm.querySelector('input[type="email"]');
            const email = emailInput.value;
            
            if (isValidEmail(email)) {
                alert('Hvala vam na prijavi! Primićete naše novosti na: ' + email);
                newsletterForm.reset();
            } else {
                alert('Molimo unesite validnu email adresu.');
            }
        });
    }
}

// Skrol funkcije

// Smooth scroll za ankor linkove
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Skrol efekat za header
window.addEventListener('scroll', function() {
    const header = document.querySelector('.header');
    if (header) {
        if (window.scrollY > 100) {
            header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
        } else {
            header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.05)';
        }
    }
});