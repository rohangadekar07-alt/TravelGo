const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    travelDate: { type: Date, required: true },
    travelSpot: { type: String, required: true },
    status: { type: String, default: 'new' },
    isArchived: { type: Boolean, default: false }, // For soft-reset
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inquiry', inquirySchema);
