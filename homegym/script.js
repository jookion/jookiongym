// Global Variables
let cart = [];
let menuItems = [];
let popularItems = [];

// Menu Data
const menuData = [
    // Cocktails
    {
        id: 1,
        name: "Mojito",
        category: "cocktails",
        price: 280,
        description: "ค็อกเทลคลาสสิกที่ผสมผสานระหว่างรัมขาว มิ้นต์ มะนาว และโซดา",
        image: "🍹",
        popular: true
    },
    {
        id: 2,
        name: "Margarita",
        category: "cocktails",
        price: 320,
        description: "ค็อกเทลเม็กซิกันที่ทำจากเตกิล่า มะนาว และคูราเซา",
        image: "🍸",
        popular: true
    },
    {
        id: 3,
        name: "Martini",
        category: "cocktails",
        price: 350,
        description: "ค็อกเทลหรูหราที่ทำจากจินและเวอร์มัท เสิร์ฟพร้อมมะกอก",
        image: "🍸",
        popular: false
    },
    {
        id: 4,
        name: "Old Fashioned",
        category: "cocktails",
        price: 380,
        description: "ค็อกเทลคลาสสิกที่ทำจากวิสกี้ บิตเตอร์ และน้ำตาล",
        image: "🥃",
        popular: false
    },
    {
        id: 5,
        name: "Negroni",
        category: "cocktails",
        price: 360,
        description: "ค็อกเทลอิตาเลียนที่ผสมผสานระหว่างจิน เวอร์มัท และคัมปารี",
        image: "🍷",
        popular: false
    },
    // Whiskey
    {
        id: 6,
        name: "Jack Daniel's",
        category: "whiskey",
        price: 450,
        description: "วิสกี้เทนเนสซีที่โด่งดังทั่วโลก รสชาติเข้มข้นและนุ่มนวล",
        image: "🥃",
        popular: true
    },
    {
        id: 7,
        name: "Johnnie Walker Black",
        category: "whiskey",
        price: 520,
        description: "สกอตช์วิสกี้พรีเมียมที่มีรสชาติซับซ้อนและกลมกล่อม",
        image: "🥃",
        popular: false
    },
    {
        id: 8,
        name: "Macallan 12",
        category: "whiskey",
        price: 850,
        description: "สกอตช์วิสกี้ชั้นสูงที่บ่มในถังโอ๊ค รสชาติหวานและมีกลิ่นหอม",
        image: "🥃",
        popular: false
    },
    {
        id: 9,
        name: "Bulleit Bourbon",
        category: "whiskey",
        price: 480,
        description: "บอร์บอนวิสกี้อเมริกันที่มีรสชาติเข้มข้นและมีกลิ่นหอมของวานิลลา",
        image: "🥃",
        popular: false
    },
    // Wine
    {
        id: 10,
        name: "Château Margaux",
        category: "wine",
        price: 2800,
        description: "ไวน์แดงชั้นสูงจากบอร์โดซ์ ประเทศฝรั่งเศส รสชาติซับซ้อนและมีกลิ่นหอม",
        image: "🍷",
        popular: true
    },
    {
        id: 11,
        name: "Dom Pérignon",
        category: "wine",
        price: 3500,
        description: "แชมเปญพรีเมียมที่มีฟองละเอียดและรสชาติกลมกล่อม",
        image: "🍾",
        popular: false
    },
    {
        id: 12,
        name: "Barolo DOCG",
        category: "wine",
        price: 1800,
        description: "ไวน์แดงอิตาเลียนที่มีรสชาติเข้มข้นและมีกลิ่นหอมของผลไม้",
        image: "🍷",
        popular: false
    },
    {
        id: 13,
        name: "Sauvignon Blanc",
        category: "wine",
        price: 650,
        description: "ไวน์ขาวที่มีรสชาติสดชื่นและมีกลิ่นหอมของผลไม้รสเปรี้ยว",
        image: "🍷",
        popular: false
    },
    // Appetizers
    {
        id: 14,
        name: "Truffle Fries",
        category: "appetizers",
        price: 180,
        description: "เฟรนช์ฟรายส์ที่โรยด้วยเกลือทรัฟเฟิลและชีสพาร์เมซาน",
        image: "🍟",
        popular: true
    },
    {
        id: 15,
        name: "Bruschetta",
        category: "appetizers",
        price: 220,
        description: "ขนมปังปิ้งที่ทาด้วยมะเขือเทศ กระเทียม และใบโหระพา",
        image: "🥖",
        popular: false
    },
    {
        id: 16,
        name: "Cheese Platter",
        category: "appetizers",
        price: 450,
        description: "จานชีสหลากหลายชนิดพร้อมผลไม้แห้งและถั่ว",
        image: "🧀",
        popular: false
    },
    {
        id: 17,
        name: "Oysters Rockefeller",
        category: "appetizers",
        price: 380,
        description: "หอยนางรมที่อบด้วยเนย ใบโหระพา และชีส",
        image: "🦪",
        popular: false
    },
    {
        id: 18,
        name: "Caviar Service",
        category: "appetizers",
        price: 1200,
        description: "คาเวียร์พรีเมียมเสิร์ฟพร้อมขนมปังปิ้งและครีม",
        image: "🐟",
        popular: false
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    menuItems = menuData;
    popularItems = menuData.filter(item => item.popular);
    
    loadMenu();
    loadPopularItems();
    setupEventListeners();
    startPromoTimer();
    showWelcomePopup();
    setupKeyboardShortcuts();
}

// Load menu items
function loadMenu() {
    const menuGrid = document.getElementById('menuGrid');
    menuGrid.innerHTML = '';
    
    menuItems.forEach(item => {
        const menuItem = createMenuItem(item);
        menuGrid.appendChild(menuItem);
    });
}

// Create menu item element
function createMenuItem(item) {
    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';
    menuItem.setAttribute('data-category', item.category);
    
    const popularBadge = item.popular ? '<div class="popular-badge">🔥 ยอดฮิต</div>' : '';
    
    menuItem.innerHTML = `
        ${popularBadge}
        <div class="menu-item-image">
            <span style="font-size: 4rem;">${item.image}</span>
        </div>
        <div class="menu-item-content">
            <div class="menu-item-header">
                <div>
                    <h3 class="menu-item-title">${item.name}</h3>
                    <span class="menu-item-category">${getCategoryName(item.category)}</span>
                </div>
                <div class="menu-item-price">฿${item.price}</div>
            </div>
            <p class="menu-item-description">${item.description}</p>
            <button class="add-to-cart-btn" onclick="addToCart(${item.id})">
                <i class="fas fa-plus"></i> เพิ่มลงตะกร้า
            </button>
        </div>
    `;
    
    return menuItem;
}

// Load popular items
function loadPopularItems() {
    const popularGrid = document.getElementById('popularGrid');
    popularGrid.innerHTML = '';
    
    popularItems.forEach(item => {
        const popularItem = createPopularItem(item);
        popularGrid.appendChild(popularItem);
    });
}

// Create popular item element
function createPopularItem(item) {
    const popularItem = document.createElement('div');
    popularItem.className = 'menu-item';
    
    popularItem.innerHTML = `
        <div class="popular-badge">🔥 ยอดฮิต</div>
        <div class="menu-item-image">
            <span style="font-size: 4rem;">${item.image}</span>
        </div>
        <div class="menu-item-content">
            <div class="menu-item-header">
                <div>
                    <h3 class="menu-item-title">${item.name}</h3>
                    <span class="menu-item-category">${getCategoryName(item.category)}</span>
                </div>
                <div class="menu-item-price">฿${item.price}</div>
            </div>
            <p class="menu-item-description">${item.description}</p>
            <button class="add-to-cart-btn" onclick="addToCart(${item.id})">
                <i class="fas fa-plus"></i> เพิ่มลงตะกร้า
            </button>
        </div>
    `;
    
    return popularItem;
}

// Get category name in Thai
function getCategoryName(category) {
    const categories = {
        'cocktails': 'ค็อกเทล',
        'whiskey': 'วิสกี้',
        'wine': 'ไวน์',
        'appetizers': 'อาหารเรียกน้ำย่อย'
    };
    return categories[category] || category;
}

// Setup event listeners
function setupEventListeners() {
    // Cart button
    document.getElementById('cartBtn').addEventListener('click', openCart);
    document.getElementById('closeCart').addEventListener('click', closeCart);
    
    // Checkout button
    document.getElementById('checkoutBtn').addEventListener('click', openCheckout);
    document.getElementById('closeCheckout').addEventListener('click', closeCheckout);
    
    // Welcome popup
    document.getElementById('closeWelcomePopup').addEventListener('click', closeWelcomePopup);
    
    // Menu filter
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterMenu(btn.dataset.category);
        });
    });
    
    // Search functionality
    document.getElementById('menuSearch').addEventListener('input', handleSearch);
    
    // Checkout form
    document.getElementById('checkoutForm').addEventListener('submit', handleOrderSubmit);
    
    // Close modals when clicking outside
    document.getElementById('cartModal').addEventListener('click', (e) => {
        if (e.target.id === 'cartModal') closeCart();
    });
    
    document.getElementById('checkoutModal').addEventListener('click', (e) => {
        if (e.target.id === 'checkoutModal') closeCheckout();
    });
}

// Filter menu by category
function filterMenu(category) {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        if (category === 'all' || item.dataset.category === category) {
            item.style.display = 'block';
            item.style.animation = 'fadeInUp 0.5s ease';
        } else {
            item.style.display = 'none';
        }
    });
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        const title = item.querySelector('.menu-item-title').textContent.toLowerCase();
        const description = item.querySelector('.menu-item-description').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || description.includes(searchTerm)) {
            item.style.display = 'block';
            item.style.animation = 'fadeInUp 0.5s ease';
        } else {
            item.style.display = 'none';
        }
    });
}

// Cart functions
function addToCart(itemId) {
    const item = menuItems.find(item => item.id === itemId);
    if (!item) return;
    
    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...item,
            quantity: 1
        });
    }
    
    updateCartDisplay();
    showNotification('เพิ่มลงตะกร้าแล้ว!');
    playAddToCartSound();
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId);
    updateCartDisplay();
}

function updateQuantity(itemId, change) {
    const item = cart.find(item => item.id === itemId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(itemId);
    } else {
        updateCartDisplay();
    }
}

function updateCartDisplay() {
    const cartCount = document.getElementById('cartCount');
    const cartItems = document.getElementById('cartItems');
    const totalPrice = document.getElementById('totalPrice');
    
    // Update cart count
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart items
    cartItems.innerHTML = '';
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: #666;">ตะกร้าว่างเปล่า</p>';
    } else {
        cart.forEach(item => {
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">฿${item.price} x ${item.quantity}</div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span class="cart-item-quantity">${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            `;
            cartItems.appendChild(cartItem);
        });
    }
    
    // Update total price
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    totalPrice.textContent = `฿${total.toLocaleString()}`;
}

// Modal functions
function openCart() {
    document.getElementById('cartModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    document.getElementById('cartModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function openCheckout() {
    if (cart.length === 0) {
        showNotification('กรุณาเพิ่มสินค้าลงตะกร้าก่อน');
        return;
    }
    
    updateOrderSummary();
    document.getElementById('checkoutModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
    closeCart();
}

function closeCheckout() {
    document.getElementById('checkoutModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function updateOrderSummary() {
    const orderSummary = document.getElementById('orderSummary');
    let summaryHTML = '';
    
    cart.forEach(item => {
        summaryHTML += `
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                <span>${item.name} x ${item.quantity}</span>
                <span>฿${(item.price * item.quantity).toLocaleString()}</span>
            </div>
        `;
    });
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    summaryHTML += `
        <hr style="margin: 1rem 0;">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
            <span>รวมทั้งหมด:</span>
            <span>฿${total.toLocaleString()}</span>
        </div>
    `;
    
    orderSummary.innerHTML = summaryHTML;
}

// Handle order submission
function handleOrderSubmit(e) {
    e.preventDefault();
    
    const formData = {
        customerName: document.getElementById('customerName').value,
        customerPhone: document.getElementById('customerPhone').value,
        customerEmail: document.getElementById('customerEmail').value,
        deliveryAddress: document.getElementById('deliveryAddress').value,
        paymentMethod: document.getElementById('paymentMethod').value,
        specialNotes: document.getElementById('specialNotes').value,
        items: cart,
        total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        orderDate: new Date().toISOString()
    };
    
    // Here you would typically send the order to your backend
    console.log('Order submitted:', formData);
    
    // Show success message
    showNotification('สั่งซื้อสำเร็จ! เราจะติดต่อกลับเร็วๆ นี้');
    
    // Clear cart and close checkout
    cart = [];
    updateCartDisplay();
    closeCheckout();
    
    // Reset form
    e.target.reset();
}

// Promotional timer
function startPromoTimer() {
    const timerElement = document.getElementById('promoTimer');
    
    function updateTimer() {
        const now = new Date();
        const endTime = new Date();
        endTime.setHours(23, 59, 59);
        
        const timeLeft = endTime - now;
        
        if (timeLeft > 0) {
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
            
            timerElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        } else {
            timerElement.textContent = '00:00:00';
        }
    }
    
    updateTimer();
    setInterval(updateTimer, 1000);
}

// Welcome popup
function showWelcomePopup() {
    setTimeout(() => {
        document.getElementById('welcomePopup').style.display = 'block';
    }, 10000); // Show after 10 seconds
}

function closeWelcomePopup() {
    document.getElementById('welcomePopup').style.display = 'none';
}

// Notification system
function showNotification(message) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = message;
    notification.style.display = 'flex';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Sound effects
function playAddToCartSound() {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
}

// Keyboard shortcuts
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl + C to open cart
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            openCart();
        }
        
        // Esc to close modals
        if (e.key === 'Escape') {
            closeCart();
            closeCheckout();
            closeWelcomePopup();
        }
    });
}

// Smooth scroll to menu
function scrollToMenu() {
    document.getElementById('menu').scrollIntoView({
        behavior: 'smooth'
    });
}

// Parallax effect for hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const parallax = document.querySelector('.hero');
    const speed = scrolled * 0.5;
    
    if (parallax) {
        parallax.style.transform = `translateY(${speed}px)`;
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe menu items for animation
document.addEventListener('DOMContentLoaded', () => {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(30px)';
        item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(item);
    });
}); 

// Carousel functionality
let currentSlide = 1;
const totalSlides = 4;

// Initialize carousel
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners for dots
    const dots = document.querySelectorAll('.dot');
    dots.forEach(dot => {
        dot.addEventListener('click', function() {
            const slideNumber = parseInt(this.getAttribute('data-slide'));
            goToSlide(slideNumber);
        });
    });

    // Set up event listeners for video
    const video = document.getElementById('jazz-video');
    const videoOverlay = document.querySelector('.video-overlay');
    
    if (video && videoOverlay) {
        videoOverlay.addEventListener('click', function() {
            if (video.paused) {
                video.play();
                this.style.opacity = '0';
            } else {
                video.pause();
                this.style.opacity = '1';
            }
        });

        video.addEventListener('play', function() {
            videoOverlay.style.opacity = '0';
        });

        video.addEventListener('pause', function() {
            videoOverlay.style.opacity = '1';
        });

        video.addEventListener('ended', function() {
            videoOverlay.style.opacity = '1';
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') {
            changeSlide(-1);
        } else if (e.key === 'ArrowRight') {
            changeSlide(1);
        }
    });

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;
    
    const carousel = document.querySelector('.ad-carousel');
    if (carousel) {
        carousel.addEventListener('touchstart', function(e) {
            touchStartX = e.changedTouches[0].screenX;
        });

        carousel.addEventListener('touchend', function(e) {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }
});

// Function to change slide
function changeSlide(direction) {
    let newSlide = currentSlide + direction;
    
    if (newSlide > totalSlides) {
        newSlide = 1;
    } else if (newSlide < 1) {
        newSlide = totalSlides;
    }
    
    goToSlide(newSlide);
}

// Function to go to specific slide
function goToSlide(slideNumber) {
    // Hide all slides
    const slides = document.querySelectorAll('.ad-slide');
    slides.forEach(slide => {
        slide.classList.remove('active');
    });
    
    // Remove active class from all dots
    const dots = document.querySelectorAll('.dot');
    dots.forEach(dot => {
        dot.classList.remove('active');
    });
    
    // Show selected slide
    const selectedSlide = document.querySelector(`[data-slide="${slideNumber}"]`);
    if (selectedSlide) {
        selectedSlide.classList.add('active');
    }
    
    // Activate corresponding dot
    const selectedDot = document.querySelector(`.dot[data-slide="${slideNumber}"]`);
    if (selectedDot) {
        selectedDot.classList.add('active');
    }
    
    // Pause video if switching away from video slide
    if (currentSlide === 4 && slideNumber !== 4) {
        const video = document.getElementById('jazz-video');
        if (video) {
            video.pause();
            const videoOverlay = document.querySelector('.video-overlay');
            if (videoOverlay) {
                videoOverlay.style.opacity = '1';
            }
        }
    }
    
    currentSlide = slideNumber;
    
    // Add animation effect
    addSlideTransition();
}

// Function to handle swipe gestures
function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
            // Swipe left - next slide
            changeSlide(1);
        } else {
            // Swipe right - previous slide
            changeSlide(-1);
        }
    }
}

// Function to add slide transition effects
function addSlideTransition() {
    const activeSlide = document.querySelector('.ad-slide.active');
    if (activeSlide) {
        activeSlide.style.animation = 'slideIn 0.5s ease-in-out';
        setTimeout(() => {
            activeSlide.style.animation = '';
        }, 500);
    }
}

// Add CSS animation for slide transitions
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        0% {
            opacity: 0;
            transform: scale(0.95);
        }
        100% {
            opacity: 1;
            transform: scale(1);
        }
    }
    
    .ad-slide {
        transition: opacity 0.5s ease-in-out, transform 0.5s ease-in-out;
    }
    
    .ad-slide.active {
        transform: scale(1);
    }
    
    .ad-slide:not(.active) {
        transform: scale(0.95);
    }
`;
document.head.appendChild(style);

// Enhanced video controls
function setupVideoControls() {
    const video = document.getElementById('jazz-video');
    if (!video) return;

    // Add custom video controls
    video.addEventListener('loadedmetadata', function() {
        console.log('Video loaded successfully');
    });

    video.addEventListener('error', function() {
        console.log('Video failed to load');
        // Show fallback content
        const videoContainer = document.querySelector('.ad-video');
        if (videoContainer) {
            videoContainer.innerHTML = `
                <div class="video-fallback">
                    <div class="fallback-content">
                        <div class="fallback-icon">🎥</div>
                        <div class="fallback-text">วิดีโอไม่พร้อมใช้งาน</div>
                        <div class="fallback-subtitle">กรุณาลองใหม่อีกครั้ง</div>
                    </div>
                </div>
            `;
        }
    });
}

// Initialize video controls
document.addEventListener('DOMContentLoaded', setupVideoControls);

// Add loading states
function showLoading() {
    const carousel = document.querySelector('.ad-carousel');
    if (carousel) {
        carousel.style.opacity = '0.7';
    }
}

function hideLoading() {
    const carousel = document.querySelector('.ad-carousel');
    if (carousel) {
        carousel.style.opacity = '1';
    }
}

// Performance optimization
let slideTimeout;
function debounceSlideChange(func, wait) {
    clearTimeout(slideTimeout);
    slideTimeout = setTimeout(func, wait);
}

// Enhanced slide change with debouncing
function changeSlideDebounced(direction) {
    debounceSlideChange(() => {
        changeSlide(direction);
    }, 100);
}

// Accessibility improvements
function setupAccessibility() {
    const arrows = document.querySelectorAll('.carousel-arrow');
    const dots = document.querySelectorAll('.dot');
    
    arrows.forEach(arrow => {
        arrow.setAttribute('aria-label', arrow.classList.contains('prev') ? 'Previous slide' : 'Next slide');
        arrow.setAttribute('role', 'button');
        arrow.setAttribute('tabindex', '0');
    });
    
    dots.forEach((dot, index) => {
        dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
        dot.setAttribute('role', 'button');
        dot.setAttribute('tabindex', '0');
    });
}

// Initialize accessibility
document.addEventListener('DOMContentLoaded', setupAccessibility);

// ค้นหาและลบ/คอมเมนต์โค้ดนี้ออก
// let autoSlide = setInterval(() => changeSlide(1), 5000);

// หรือถ้ามีฟังก์ชัน autoPlayCarousel ให้คอมเมนต์ไว้
// function autoPlayCarousel() {
//     setInterval(() => changeSlide(1), 5000);
// }