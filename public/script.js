// Auth UI Toggle and Date Restriction
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const authLinks = document.getElementById('authLinks');
    const userProfile = document.getElementById('userProfile');

    if (token) {
        if (authLinks) authLinks.style.display = 'none';
        if (userProfile) userProfile.style.display = 'block';
        
        // Fetch profile to see if there's an image
        fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.user.profileImage) {
                const navImg = document.getElementById('navUserImage');
                const defaultIcon = document.getElementById('navDefaultAvatar');
                if (navImg && defaultIcon) {
                    navImg.src = data.user.profileImage;
                    navImg.style.display = 'block';
                    defaultIcon.style.display = 'none';
                }
            }
        }).catch(err => console.error('Profile fetch failed', err));

    } else {
        if (authLinks) authLinks.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
    }

    // Set dynamic date restrictions (Today as minimum)
    const today = new Date().toLocaleDateString('en-CA'); // Get local date in YYYY-MM-DD format
    const travelDate = document.getElementById('travelDate');
    const modalDate = document.getElementById('modalDate');
    
    if (travelDate) {
        travelDate.setAttribute('min', today);
        // travelDate.value = today; // Optional: default to today
    }
    if (modalDate) {
        modalDate.setAttribute('min', today);
        // modalDate.value = today; // Optional: default to today
    }
});

// Navbar transparency and Active link on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const sections = document.querySelectorAll('header, section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // Transparency logic
    const scrollPos = window.scrollY || window.pageYOffset;
    if (scrollPos > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Scroll Spy: Highlight active link
    let current = "";
    sections.forEach((section) => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollPos >= sectionTop - 200) {
            current = section.getAttribute("id");
        }
    });

    navLinks.forEach((link) => {
        link.classList.remove("active");
        const href = link.getAttribute("href");
        if (href === `#${current}` || (href === "/" && !current)) {
            link.classList.add("active");
        }
    });
});

// Mobile Menu Toggle
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');

if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        menuBtn.classList.toggle('active');
        navLinks.classList.toggle('active');
    });
}

// Close menu when clicking links
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        menuBtn.classList.remove('active');
        navLinks.classList.remove('active');
    });
});

// Form Submission
const inquiryForm = document.getElementById('inquiryForm');
const formStatus = document.getElementById('formStatus');

if (inquiryForm) {
    inquiryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Auth Check
        const token = localStorage.getItem('token');
        if (!token) {
            showToast('Please Register or Login first to send an Inquiry.', 'error');
            setTimeout(() => {
                window.location.href = '/register.html';
            }, 2000);
            return;
        }

        // Show loading state
        const submitBtn = inquiryForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        const formData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            mobileNumber: document.getElementById('mobileNumber').value,
            travelDate: document.getElementById('travelDate').value,
            travelSpot: document.getElementById('travelSpot').value
        };

        // Mobile validation
        if (!/^\d{10}$/.test(formData.mobileNumber)) {
            showToast('Please enter a valid 10-digit mobile number.', 'error');
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            return;
        }

        try {
            const response = await fetch('/api/inquiries', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : ''
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Inquiry submitted successfully!', 'success');
                inquiryForm.reset();
            } else {
                showToast(result.message || 'Error occurred.', 'error');
            }
        } catch (error) {
            console.error('Submission error:', error);
            showToast('Check if MongoDB is running.', 'error');
        } finally {
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        }
    });
}

// Toast Function
function showToast(message, type) {
    const toast = document.getElementById('toast');
    const toastText = document.getElementById('toastText');
    const toastIcon = document.getElementById('toastIcon');

    toastText.textContent = message;
    toast.className = `toast show ${type}`;
    toastIcon.textContent = type === 'success' ? '✅' : '❌';

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Filter Destinations
function filterDestinations(category) {
    const cards = document.querySelectorAll('.card');
    const buttons = document.querySelectorAll('.filter-btn');

    // Update active button
    buttons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(category)) {
            btn.classList.add('active');
        } else if (category === 'all' && btn.textContent.toLowerCase().includes('all')) {
            btn.classList.add('active');
        }
    });

    // Filter cards
    cards.forEach(card => {
        if (category === 'all' || card.getAttribute('data-category') === category) {
            card.classList.remove('hide');
        } else {
            card.classList.add('hide');
        }
    });
}

// Package Data
const packages = {
    'Bali': { price: 'Rs 1', duration: '5 Days / 4 Nights', img: 'images/bali.png' },
    'Switzerland': { price: 'Rs 1', duration: '7 Days / 6 Nights', img: 'images/switzerland.png' },
    'Maldives': { price: 'Rs 1', duration: '4 Days / 3 Nights', img: 'images/maldives.png' },
    'Japan': { price: 'Rs 1', duration: '6 Days / 5 Nights', img: 'images/japan.png' },
    'Dubai': { price: 'Rs 1', duration: '4 Days / 3 Nights', img: 'images/dubai.png' },
    'Paris': { price: 'Rs 1', duration: '5 Days / 4 Nights', img: 'images/paris.png' },
    'London': { price: 'Rs 1', duration: '5 Days / 4 Nights', img: 'images/london.png' },
    // Indian Spots
    'Manali': { price: 'Rs 1', duration: '4 Days / 3 Nights', img: 'images/manali.png' },
    'Goa': { price: 'Rs 1', duration: '3 Days / 2 Nights', img: 'images/goa.png' },
    'Rajasthan': { price: 'Rs 1', duration: '5 Days / 4 Nights', img: 'images/rajasthan.png' },
    'Kerala': { price: 'Rs 1', duration: '4 Days / 3 Nights', img: 'images/kerala.png' },
    'Kashmir': { price: 'Rs 1', duration: '6 Days / 5 Nights', img: 'images/kashmir.png' },
    'Ladakh': { price: 'Rs 1', duration: '7 Days / 6 Nights', img: 'images/ladakh.png' },
    'Andaman': { price: 'Rs 1', duration: '5 Days / 4 Nights', img: 'images/andaman.png' },
    'Hampi': { price: 'Rs 1', duration: '3 Days / 2 Nights', img: 'images/hampi.png' }
};

let currentSpot = '';

// Book Spot Function (Opens Modal)
function bookSpot(spotName) {
    // Auth Check
    const token = localStorage.getItem('token');
    if (!token) {
        showToast('Please Register or Login first to Book your trip.', 'error');
        setTimeout(() => {
            window.location.href = '/register.html';
        }, 2000);
        return;
    }

    currentSpot = spotName;
    const pkg = packages[spotName];
    
    document.getElementById('modalTitle').textContent = `Explore ${spotName}`;
    document.getElementById('modalDuration').textContent = `${pkg.duration} · All Inclusive`;
    document.getElementById('modalPrice').textContent = pkg.price;
    document.getElementById('modalImg').src = pkg.img;
    
    // Always use 'flex' - overlay uses flexbox for centering (desktop) and full-screen (mobile)
    document.getElementById('bookingModal').style.display = 'flex';
    document.body.style.overflow = 'hidden'; // Stop scroll
}

function closeModal() {
    document.getElementById('bookingModal').style.display = 'none';
    document.body.style.overflow = 'auto'; // Enable scroll
}

// Modal Form Submission
const modalForm = document.getElementById('modalInquiryForm');
if (modalForm) {
    modalForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = modalForm.querySelector('.btn-confirm');
        const originalBtnContent = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing Secure Payment...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.8';

        const pkg = packages[currentSpot];
        const selectedMode = document.querySelector('input[name="mode"]:checked').value;

        const bookingData = {
            fullName: document.getElementById('modalName').value,
            email: document.getElementById('modalEmail').value,
            mobileNumber: document.getElementById('modalPhone').value,
            travelDate: document.getElementById('modalDate').value,
            travelSpot: currentSpot,
            travelMode: selectedMode,
            price: pkg.price,
            duration: pkg.duration
        };

        // Mobile validation
        if (!/^\d{10}$/.test(bookingData.mobileNumber)) {
            showToast('Please enter a valid 10-digit mobile number.', 'error');
            submitBtn.innerHTML = originalBtnContent;
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            return;
        }
        // Store booking data temporarily and redirect to payment options page
        sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
        
        setTimeout(() => {
            window.location.href = '/payment-options.html';
        }, 800);
    });
}

// Hero Background & Content Slideshow
function startHeroSlideshow() {
    const backgrounds = document.querySelectorAll('.hero-bg');
    const heroTitle = document.getElementById('heroTitle');
    const heroDesc = document.getElementById('heroDesc');
    
    if (backgrounds.length === 0 || !heroTitle || !heroDesc) return;
    
    const content = [
        {
            title: "Peak Adventures Await",
            desc: "Conquer the world's most majestic summits with our expert guides."
        },
        {
            title: "Serenity in Every Wave",
            desc: "Dive into crystal clear waters and explore hidden island paradises."
        },
        {
            title: "Untamed Golden Sands",
            desc: "Experience the timeless beauty of vast dunes under endless horizons."
        },
        {
            title: "The Eternal Taj Mahal",
            desc: "Witness the timeless symbol of love in the heart of historic Agra."
        },
        {
            title: "Heaven on Earth: Kashmir",
            desc: "Experience the soul-stirring beauty of Dal Lake and snow-capped peaks."
        },
        {
            title: "Serene Kerala Backwaters",
            desc: "Unwind in luxury houseboats amidst lush green tropical canals."
        },
        {
            title: "Royal Heritage Rajasthan",
            desc: "Step into a world of majestic forts, golden palaces, and vibrant culture."
        }
    ];
    
    let currentIndex = 0;
    
    setInterval(() => {
        // Fade out text
        heroTitle.style.opacity = '0';
        heroDesc.style.opacity = '0';
        heroTitle.style.transform = 'translateY(-20px)';
        heroDesc.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            // Remove active from current BG
            backgrounds[currentIndex].classList.remove('active');
            
            // Increment index
            currentIndex = (currentIndex + 1) % backgrounds.length;
            
            // Add active to next BG
            backgrounds[currentIndex].classList.add('active');
            
            // Change text content
            heroTitle.textContent = content[currentIndex].title;
            heroDesc.textContent = content[currentIndex].desc;
            
            // Fade in text
            heroTitle.style.opacity = '1';
            heroDesc.style.opacity = '1';
            heroTitle.style.transform = 'translateY(0)';
            heroDesc.style.transform = 'translateY(0)';
        }, 800); // Sync with CSS transition
        
    }, 4000); // Change every 4 seconds for a faster feel
}

// Start slideshow when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startHeroSlideshow);
} else {
    startHeroSlideshow();
}

// QR Payment Simulation - Replaces Razorpay

// Dummy function removed - real Razorpay used instead

// Reset button state when page is shown (fixes back button cache issue)
window.addEventListener('pageshow', (event) => {
    const submitBtn = document.querySelector('#modalInquiryForm .btn-confirm');
    if (submitBtn) {
        submitBtn.innerHTML = '<span>Confirm & Pay Now</span><i class="fas fa-arrow-right"></i>';
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('bookingModal');
    if (event.target == modal) {
        closeModal();
    }
}


// Handle Preloader
document.addEventListener('DOMContentLoaded', () => {
    document.body.classList.add('loading');
    
    // Hide preloader after page load + slight buffer for animation feel
    window.addEventListener('load', () => {
        setTimeout(() => {
            const preloader = document.getElementById('preloader');
            if (preloader) {
                preloader.classList.add('fade-out');
                document.body.classList.remove('loading');
            }
        }, 1200); // 1.2s delay for visual impact
    });
});
