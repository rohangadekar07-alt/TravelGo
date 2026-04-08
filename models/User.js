const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNumber: { type: String, required: true },
    address: { type: String, required: true },
    liveLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        timestamp: { type: Date }
    },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    isArchived: { type: Boolean, default: false },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    profileImage: { type: String, default: '' }, // Path to profile image
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
userSchema.pre('save', function() {
    this.updatedAt = Date.now();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
