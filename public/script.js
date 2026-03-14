// Navbar transparency and Active link on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    const sections = document.querySelectorAll('section, header');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // Transparency logic
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }

    // Scroll Spy: Highlight active link
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 150)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current) && current !== null) {
            link.classList.add('active');
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
                    'Content-Type': 'application/json'
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
    'Bali': { price: 'Rs 45,000', duration: '5 Days / 4 Nights', img: 'images/bali.png' },
    'Switzerland': { price: 'Rs 1,65,000', duration: '7 Days / 6 Nights', img: 'images/switzerland.png' },
    'Maldives': { price: 'Rs 75,000', duration: '4 Days / 3 Nights', img: 'images/maldives.png' },
    'Japan': { price: 'Rs 1,15,000', duration: '6 Days / 5 Nights', img: 'images/japan.png' },
    'Dubai': { price: 'Rs 55,000', duration: '4 Days / 3 Nights', img: 'images/dubai.png' },
    'Paris': { price: 'Rs 1,20,000', duration: '5 Days / 4 Nights', img: 'images/paris.png' },
    'London': { price: 'Rs 95,000', duration: '5 Days / 4 Nights', img: 'images/london.png' },
    // Indian Spots
    'Manali': { price: 'Rs 12,000', duration: '4 Days / 3 Nights', img: 'images/manali.png' },
    'Goa': { price: 'Rs 8,500', duration: '3 Days / 2 Nights', img: 'images/goa.png' },
    'Rajasthan': { price: 'Rs 15,500', duration: '5 Days / 4 Nights', img: 'images/rajasthan.png' },
    'Kerala': { price: 'Rs 13,000', duration: '4 Days / 3 Nights', img: 'images/kerala.png' },
    'Kashmir': { price: 'Rs 22,500', duration: '6 Days / 5 Nights', img: 'images/kashmir.png' },
    'Ladakh': { price: 'Rs 28,000', duration: '7 Days / 6 Nights', img: 'images/ladakh.png' },
    'Andaman': { price: 'Rs 35,000', duration: '5 Days / 4 Nights', img: 'images/andaman.png' },
    'Hampi': { price: 'Rs 7,500', duration: '3 Days / 2 Nights', img: 'images/hampi.png' }
};

let currentSpot = '';

// Book Spot Function (Opens Modal)
function bookSpot(spotName) {
    currentSpot = spotName;
    const pkg = packages[spotName];
    
    document.getElementById('modalTitle').textContent = `Explore ${spotName}`;
    document.getElementById('modalDuration').textContent = `${pkg.duration} · All Inclusive`;
    document.getElementById('modalPrice').textContent = pkg.price;
    document.getElementById('modalImg').src = pkg.img;
    
    document.getElementById('bookingModal').style.display = 'block';
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
        // Store booking data temporarily and redirect to QR payment page
        sessionStorage.setItem('pendingBooking', JSON.stringify(bookingData));
        
        setTimeout(() => {
            window.location.href = '/payment.html';
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
            title: "Tropical Paradise Found",
            desc: "Unwind in the lush greenery and vibrant culture of exotic escapes."
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
        }, 1000); // Sync with CSS transition
        
    }, 6000); // Change every 6 seconds to account for text transition
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
