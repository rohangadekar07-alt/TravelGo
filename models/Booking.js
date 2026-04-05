const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: { type: String, required: true },
    email: { type: String },
    mobileNumber: { type: String, required: true },
    travelDate: { type: Date, required: true },
    travelSpot: { type: String, required: true },
    travelMode: { type: String, required: true },
    price: { type: String, required: true },
    basePrice: { type: Number },
    platformFee: { type: Number, default: 0 },
    duration: { type: String, required: true },
    paymentStatus: { type: String, default: 'Paid' },
    paymentMethod: { type: String, default: 'Online' },
    bookingId: { type: String },
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
