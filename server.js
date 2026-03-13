const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Request Logger
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
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

// Inquiry Schema (For the main form)
const inquirySchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    travelDate: { type: Date, required: true },
    travelSpot: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now }
});

// Booking Schema (For the modal/confirmed bookings)
const bookingSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    travelDate: { type: Date, required: true },
    travelSpot: { type: String, required: true },
    travelMode: { type: String, required: true },
    price: { type: String, required: true },
    duration: { type: String, required: true },
    paymentStatus: { type: String, default: 'Success' },
    submittedAt: { type: Date, default: Date.now }
});

const Inquiry = mongoose.model('Inquiry', inquirySchema);
const Booking = mongoose.model('Booking', bookingSchema);

// Routes
// 1. Submit Inquiry (Main Form)
app.post('/api/inquiries', async (req, res) => {
    try {
        const { fullName, email, mobileNumber, travelDate, travelSpot } = req.body;
        const newInquiry = new Inquiry({ fullName, email, mobileNumber, travelDate, travelSpot });
        await newInquiry.save();
        res.status(201).json({ success: true, message: 'Inquiry submitted successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
});

// 2. Submit Booking (Modal Form)
app.post('/api/bookings', async (req, res) => {
    try {
        const { fullName, mobileNumber, travelDate, travelSpot, travelMode, price, duration } = req.body;
        const newBooking = new Booking({ 
            fullName, mobileNumber, travelDate, travelSpot, travelMode, price, duration 
        });
        await newBooking.save();
        res.status(201).json({ success: true, message: 'Booking confirmed successfully' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Database error', error: err.message });
    }
});

// 3. Admin Login
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

// Serve the admin page explicitly if needed
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 5. 404 Handler (JSON)
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
