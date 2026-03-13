// Navbar transparency on scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
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
    
    document.getElementById('modalTitle').textContent = `Book Your Trip to ${spotName}`;
    document.getElementById('modalDuration').textContent = `⏳ ${pkg.duration} | All Inclusive Pack`;
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
        submitBtn.textContent = 'Processing...';
        submitBtn.disabled = true;

        const pkg = packages[currentSpot];
        const selectedMode = document.querySelector('input[name="mode"]:checked').value;

        const formData = {
            fullName: document.getElementById('modalName').value,
            mobileNumber: document.getElementById('modalPhone').value,
            travelDate: document.getElementById('modalDate').value,
            travelSpot: currentSpot,
            travelMode: selectedMode,
            price: pkg.price,
            duration: pkg.duration
        };

        // Mobile validation
        if (!/^\d{10}$/.test(formData.mobileNumber)) {
            showToast('Please enter a valid 10-digit mobile number.', 'error');
            submitBtn.textContent = 'Confirm Booking';
            submitBtn.disabled = false;
            return;
        }

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            let result;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                result = await response.json();
            }

            if (response.ok) {
                // Show Dummy Razorpay UI
                showPaymentGateway(formData);
                closeModal();
                modalForm.reset();
            } else {
                const errMsg = result ? (result.message || result.error) : `Server Error (${response.status})`;
                showToast(errMsg, 'error');
            }
        } catch (error) {
            console.error('Full Error:', error);
            showToast(`Error: ${error.message || 'Connection failed'}`, 'error');
        }
 finally {
            submitBtn.textContent = 'Confirm Booking';
            submitBtn.disabled = false;
        }
    });
}

// Dummy Razorpay Simulation
function showPaymentGateway(bookingData) {
    const paymentOverlay = document.createElement('div');
    paymentOverlay.className = 'payment-overlay';
    paymentOverlay.innerHTML = `
        <div class="razorpay-mock">
            <div class="rp-header">
                <div class="rp-logo">Travel<span>GO</span></div>
                <div class="rp-amount">${bookingData.price}</div>
            </div>
            <div class="rp-content">
                <p style="font-size: 0.8rem; color: #666; margin-bottom: 15px;">Secure Payment Gateway</p>
                <div class="rp-method">
                    <i class="fas fa-university"></i>
                    <span>Net Banking</span>
                </div>
                <div class="rp-method active">
                    <i class="fas fa-credit-card"></i>
                    <span>Cards (Visa, Matercard)</span>
                </div>
                <div class="rp-method">
                    <i class="fab fa-google-pay"></i>
                    <span>UPI / Google Pay</span>
                </div>
                <button class="rp-pay-btn" id="dummyPayBtn">Pay ${bookingData.price}</button>
            </div>
            <p style="text-align: center; font-size: 0.7rem; color: #999; margin-top: 15px;">
                <i class="fas fa-shield-alt"></i> Razorpay Secured | SSL Encrypted
            </p>
        </div>
    `;
    document.body.appendChild(paymentOverlay);

    document.getElementById('dummyPayBtn').onclick = function() {
        this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
        this.disabled = true;
        
        setTimeout(() => {
            paymentOverlay.remove();
            showToast(`Payment Successful! Trip to ${bookingData.travelSpot} confirmed.`, 'success');
        }, 2000);
    };
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('bookingModal');
    if (event.target == modal) {
        closeModal();
    }
}
