const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const jwt = require('jsonwebtoken');
const Razorpay = require('razorpay');
const crypto = require('crypto');

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust first proxy (important for Vercel/Render https detection)
const PORT = process.env.PORT || 5000;

// Initialize Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.get('/api/config', (req, res) => {
    res.json({ 
        googleMapsKey: process.env.GOOGLE_MAPS_KEY || null,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || null
    });
});

app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

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
mongoose.connect(process.env.MONGODB_URI, {
    bufferCommands: false, // Don't buffer commands if DB is down
    serverSelectionTimeoutMS: 5000 // Timeout after 5s
}).then(() => {
    console.log('✅ SUCCESS: Connected to MongoDB');
}).catch((err) => {
    console.error('❌ ERROR: Could not connect to MongoDB.');
    console.error('CAUSE:', err.message);
    console.error('Is MongoDB running? Try starting it with: mongod');
});

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
        const { fullName, email, mobileNumber, travelDate, travelSpot, travelMode, price, basePrice, platformFee, duration, paymentStatus, paymentMethod, bookingId } = req.body;

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
            fullName, email, mobileNumber, travelDate, travelSpot, travelMode, price, basePrice, platformFee, duration,
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

// 3. Create Razorpay Order
app.post('/api/payments/create-order', async (req, res) => {
    try {
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
            // Signature mismatch
            res.status(400).json({ success: false, message: 'Payment verification failed (Signature mismatch)' });
        }
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
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
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// 4. Get Data for Admin
app.get('/api/admin/data', async (req, res) => {
    try {
        const inquiries = await Inquiry.find().sort({ submittedAt: -1 });
        const bookings = await Booking.find().sort({ submittedAt: -1 });
        res.json({ inquiries, bookings });
    } catch (err) {
        res.status(500).json({ message: 'Internal server error' });
    }
});

// 5. Clear All Data (Admin only)
app.delete('/api/admin/clear-data', async (req, res) => {
    try {
        await Inquiry.deleteMany({});
        await Booking.deleteMany({});
        await User.deleteMany({});
        await OTP.deleteMany({});
        res.json({ success: true, message: 'All inquiries, bookings, users, and OTPs have been cleared.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Error clearing data', error: err.message });
    }
});

// Serve the admin page explicitly if needed
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 6. Settings API
app.get('/api/settings/platform-fee', async (req, res) => {
    try {
        let setting = await Setting.findOne({ key: 'platformFee' });
        if (!setting) {
             setting = new Setting({ key: 'platformFee', value: 0 });
             await setting.save();
        }
        res.json({ success: true, platformFee: 9 });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

app.post('/api/admin/settings/platform-fee', async (req, res) => {
    try {
        const { value } = req.body;
        let setting = await Setting.findOne({ key: 'platformFee' });
        if (!setting) {
             setting = new Setting({ key: 'platformFee', value: Number(value) });
        } else {
             setting.value = Number(value);
        }
        await setting.save();
        res.json({ success: true, message: 'Platform fee updated successfully', platformFee: setting.value });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// 5. 404 Handler (JSON)
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
