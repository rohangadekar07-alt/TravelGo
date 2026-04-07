const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Inquiry = require('./models/Inquiry');
const Booking = require('./models/Booking');
const User = require('./models/User');
const OTP = require('./models/OTP');

async function clearAll() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        
        console.log('Clearing Inquiries...');
        await Inquiry.deleteMany({});
        
        console.log('Clearing Bookings...');
        await Booking.deleteMany({});
        
        console.log('Clearing Users...');
        await User.deleteMany({});
        
        console.log('Clearing OTPs...');
        await OTP.deleteMany({});
        
        console.log('✅ ALL DATA CLEARED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error clearing data:', err);
        process.exit(1);
    }
}

clearAll();
