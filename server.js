const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const multer = require('multer');

dotenv.config();

// Multer Config for Profile Images
// Use /tmp on Vercel (read-only filesystem), else local uploads/
const uploadDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const app = express();
app.set('trust proxy', 1); // Trust first proxy (important for Vercel/Render https detection)
const PORT = process.env.PORT || 5000;

// Initialize Razorpay
let razorpay;
try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.warn('⚠️ WARNING: Razorpay keys are missing in environment variables. Payment features will not work.');
    } else {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
        console.log('✅ Razorpay initialized successfully');
    }
} catch (error) {
    console.error('❌ Razorpay initialization failed:', error.message);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.get('/api/config', (req, res) => {
    res.json({ 
        googleMapsKey: process.env.GOOGLE_MAPS_KEY || null,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || null
    });
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadDir));

// Request Logger & DB Monitor
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    }
    // Check DB status for API routes
    if (req.url.startsWith('/api/') && mongoose.connection.readyState !== 1) {
        return res.status(503).json({ 
            success: false, 
            message: 'Database is currently disconnected. Please wait or check your connection.' 
        });
    }
    next();
});

// MongoDB Connection
if (!process.env.MONGODB_URI) {
    console.error('❌ FATAL ERROR: MONGODB_URI is not defined in environment variables.');
    console.error('Please add MONGODB_URI to your deployment platform settings.');
} else {
    mongoose.connect(process.env.MONGODB_URI, {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000
    }).then(() => {
        console.log('✅ SUCCESS: Connected to MongoDB');
    }).catch((err) => {
        console.error('❌ ERROR: Could not connect to MongoDB.');
        console.error('CAUSE:', err.message);
    });
}

// Handle connection events
mongoose.connection.on('error', err => {
    console.error('Mongoose connection error:', err);
});

// Models
const Inquiry = require('./models/Inquiry');
const Booking = require('./models/Booking');
const User = require('./models/User');
const OTP = require('./models/OTP');
const Setting = require('./models/Setting');

// Middleware for JWT Authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

    jwt.verify(token, process.env.JWT_SECRET || 'travelgo_super_secret_key_2026', (err, user) => {
        if (err) return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
        req.user = user;
        next();
    });
};

// Routes
// 1. Submit Inquiry (Main Form)
app.post('/api/inquiries', async (req, res) => {
    try {
        const { fullName, email, mobileNumber, travelDate, travelSpot } = req.body;

        // Date Validation: Prevent past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(travelDate) < today) {
            return res.status(400).json({ success: false, message: 'Invalid travel date. Past dates are not allowed.' });
        }
        
        // Optional: Check if user is logged in
        let userId = null;
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'travelgo_secret_key');
                userId = decoded.id;
            } catch (e) {}
        }

        const newInquiry = new Inquiry({ 
            userId, 
            fullName, 
            email, 
            mobileNumber, 
            travelDate, 
            travelSpot 
        });
        await newInquiry.save();
        res.status(201).json({ success: true, message: 'Inquiry submitted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
});

// 2. Submit Booking (Modal Form)
app.post('/api/bookings', async (req, res) => {
    try {
        const { fullName, email, mobileNumber, travelDate, travelSpot, travelMode, price, basePrice, platformFee, gstAmount, gstPercent, duration, paymentStatus, paymentMethod, bookingId } = req.body;

        // Date Validation: Prevent past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (new Date(travelDate) < today) {
            return res.status(400).json({ success: false, message: 'Invalid travel date. Past dates are not allowed.' });
        }
        
        // Optional: Check if user is logged in
        let userId = null;
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'travelgo_secret_key');
                userId = decoded.id;
            } catch (e) {}
        }

        const newBooking = new Booking({ 
            userId,
            fullName, email, mobileNumber, travelDate, travelSpot, travelMode, 
            price, basePrice, platformFee, gstAmount: gstAmount || 0, gstPercent: gstPercent || 0,
            duration,
            paymentStatus: paymentStatus || 'Paid',
            paymentMethod: paymentMethod || 'Online',
            bookingId
        });
        await newBooking.save();
        res.status(201).json({ success: true, message: 'Booking submitted successfully', bookingId: newBooking._id });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
});

// --- RAZORPAY INTEGRATION ---

// 8. Update User Profile (Mobile and Address only)
app.post('/api/user/update-profile', authenticateToken, async (req, res) => {
    try {
        const { mobileNumber, address } = req.body;
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (mobileNumber) user.mobileNumber = mobileNumber;
        if (address) user.address = address;

        await user.save();
        res.json({ success: true, message: 'Profile updated successfully', user });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error updating profile', error: err.message });
    }
});

// 3. Create Razorpay Order
app.post('/api/payments/create-order', async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(503).json({ 
                success: false, 
                message: 'Razorpay service is not configured on this server. Please check environment variables.' 
            });
        }
        const { amount, bookingData } = req.body;
        
        // Amount must be in paisa! So (Rs * 100)
        // Ensure total amount is used correctly
        const cleanAmount = parseInt(amount.replace(/[^0-9]/g, ''));
        
        const options = {
            amount: cleanAmount * 100, // paisa
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        
        if (!order) {
            return res.status(500).json({ success: false, message: 'Razorpay order creation failed' });
        }

        res.json({
            success: true,
            orderId: order.id,
            amount: order.amount,
            keyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, message: 'Failed to create order', error: error.message });
    }
});

// 4. Verify Payment Signature
app.post('/api/payments/verify-payment', async (req, res) => {
    try {
        const { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature,
            bookingData,
            bookingCode
        } = req.body;

        // Verify signature
        if (!process.env.RAZORPAY_KEY_SECRET) {
            return res.status(503).json({ success: false, message: 'Razorpay configuration missing (Secret)' });
        }
        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature === razorpay_signature) {
            // Signature matched - payment success
            
            // 1. Create or update booking in DB
            const newBooking = new Booking({
                ...bookingData,
                paymentStatus: 'Paid',
                paymentMethod: 'Online',
                bookingId: bookingCode,
                razorpayOrderId: razorpay_order_id,
                razorpayPaymentId: razorpay_payment_id,
                razorpaySignature: razorpay_signature,
                confirmedAt: new Date()
            });

            // If userId is provided (token decode)
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (token) {
                try {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'travelgo_super_secret_key_2026');
                    newBooking.userId = decoded.id;
                } catch (e) {}
            }

            await newBooking.save();

            res.json({ 
                success: true, 
                message: 'Payment verified and booking confirmed!',
                bookingId: newBooking._id 
            });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature! Payment verification failed.' });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ success: false, message: 'Verification error', error: error.message });
    }
});

// 5. QR Payment / Manual Confirmation
app.post('/api/payments/qr-confirm', async (req, res) => {
    try {
        const { bookingData, bookingCode, paymentMethod } = req.body;

        const newBooking = new Booking({
            ...bookingData,
            paymentStatus: 'Paid',
            paymentMethod: paymentMethod || 'Online',
            bookingId: bookingCode,
            manualPayment: true,
            submittedAt: new Date(),
            confirmedAt: new Date()
        });

        // Resolve userId
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'travelgo_super_secret_key_2026');
                newBooking.userId = decoded.id;
            } catch (e) {}
        }

        await newBooking.save();
        res.json({ success: true, message: 'Booking confirmed successfully', bookingId: newBooking._id });
    } catch (error) {
        console.error('QR Confirm Error:', error);
        res.status(500).json({ success: false, message: 'Submission error', error: error.message });
    }
});

// 2b. Admin: Confirm Cash Payment
app.patch('/api/bookings/:id/confirm-cash', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { paymentStatus: 'Cash Confirmed', confirmedAt: new Date() },
            { returnDocument: 'after' }
        );
        if (!booking) {
            console.log(`[Confirm Error] Booking not found: ${req.params.id}`);
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        console.log(`[Confirm Success] Booking ${booking.bookingId} (${booking._id}) marked as Cash Confirmed`);
        res.json({ success: true, message: 'Cash payment confirmed', booking });
    } catch (err) {
        console.error('[Confirm Error]', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// 2d. Admin: Cancel Booking
app.patch('/api/bookings/:id/cancel', async (req, res) => {
    try {
        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { paymentStatus: 'Cancelled' },
            { returnDocument: 'after' }
        );
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        res.json({ success: true, message: 'Booking cancelled', booking });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// 2c. Get Internal Booking Status (Robust Lookup)
app.get('/api/bookings/status/:idOrCode', async (req, res) => {
    try {
        const query = req.params.idOrCode;
        console.log(`[Status Check] Querying: ${query}`); // LOGGING ADDED
        
        let booking;
        if (mongoose.Types.ObjectId.isValid(query)) {
            booking = await Booking.findById(query);
        } else {
            booking = await Booking.findOne({ bookingId: query });
        }
        
        if (!booking) {
            console.log(`[Status Check] NOT FOUND: ${query}`);
            return res.status(404).json({ success: false, message: 'Booking not found' });
        }
        
        console.log(`[Status Check] SUCCESS: Found ${booking.bookingId} for ${booking.fullName}`);
        res.json({ 
            success: true, 
            paymentStatus: booking.paymentStatus, 
            bookingId: booking.bookingId,
            booking: booking 
        });
    } catch (err) {
        console.error(`[Status Check] ERROR: ${err.message}`);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// 3. Auth & User Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

// 4. Admin Login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    // Check Super Admin first
    if (username === process.env.SUPER_ADMIN_USERNAME && password === process.env.SUPER_ADMIN_PASSWORD) {
        return res.json({ success: true, message: 'Super Admin Login successful', role: 'superadmin' });
    }
    
    // Check Regular Admin
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        return res.json({ success: true, message: 'Admin Login successful', role: 'admin' });
    }
    
    res.status(401).json({ success: false, message: 'Invalid credentials' });
});

// 4. Get Data for Admin
app.get('/api/admin/data', async (req, res) => {
    try {
        // Main operational dashboard only shows non-archived items for both roles
        const filter = { isArchived: { $ne: true } };
        
        const inquiries = await Inquiry.find(filter).sort({ submittedAt: -1 });
        const bookings = await Booking.find(filter).sort({ submittedAt: -1 });
        res.json({ inquiries, bookings });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// New: Get Users for Super Admin
app.get('/api/superadmin/users', async (req, res) => {
    try {
        const users = await User.find({ isArchived: { $ne: true } }).sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error fetching users' });
    }
});

// 4b. Admin: Mark Inquiry as Read
app.patch('/api/inquiries/:id/read', async (req, res) => {
    try {
        const inquiry = await Inquiry.findByIdAndUpdate(
            req.params.id,
            { status: 'read' },
            { returnDocument: 'after' }
        );
        if (!inquiry) {
            return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }
        res.json({ success: true, message: 'Inquiry marked as read', inquiry });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// 5. Clear All Data (Admin only - now Soft Clear)
app.delete('/api/admin/clear-data', async (req, res) => {
    try {
        // Hard-reset the database to truly clear test data (Bookings and Inquiries only)
        // User registration data is kept intact as requested.
        const resInq = await Inquiry.deleteMany({});
        const resBook = await Booking.deleteMany({});
        
        console.log(`[RESET] ${resInq.deletedCount} Inquiries, ${resBook.deletedCount} Bookings deleted. Users preserved.`);
        
        res.json({ 
            success: true, 
            message: 'All inquiries and bookings have been deleted. Registered users are safe.',
            counts: { inquiries: resInq.deletedCount, bookings: resBook.deletedCount }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error clearing data', error: err.message });
    }
});

// Serve the admin page explicitly if needed
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/api/settings/platform-fee', async (req, res) => {
    try {
        let fee = await Setting.findOne({ key: 'platformFee' });
        let gst = await Setting.findOne({ key: 'gstPercent' });
        res.json({ 
            success: true, 
            platformFee: fee ? fee.value : 9,
            gstPercent: gst ? gst.value : 0,
            feeUpdatedAt: fee ? fee.updatedAt : null,
            gstUpdatedAt: gst ? gst.updatedAt : null
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

app.post('/api/admin/settings/update', async (req, res) => {
    try {
        const { platformFee, gstPercent } = req.body;
        const now = new Date();
        
        if (platformFee !== undefined) {
            await Setting.findOneAndUpdate(
                { key: 'platformFee' }, 
                { value: Number(platformFee), updatedAt: now }, 
                { upsert: true }
            );
        }
        if (gstPercent !== undefined) {
            await Setting.findOneAndUpdate(
                { key: 'gstPercent' }, 
                { value: Number(gstPercent), updatedAt: now }, 
                { upsert: true }
            );
        }
        
        res.json({ success: true, message: 'Settings updated successfully', updatedAt: now });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// 5. 404 Handler (JSON)
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Start server: only listen locally (not on Vercel which is serverless)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;
