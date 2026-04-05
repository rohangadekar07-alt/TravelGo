const User = require('../models/User');
const Booking = require('../models/Booking');
const Inquiry = require('../models/Inquiry');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { fullName, mobileNumber, address, liveLocation } = req.body;
        
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (fullName) user.fullName = fullName;
        if (mobileNumber) user.mobileNumber = mobileNumber;
        if (address) user.address = address;
        if (liveLocation) user.liveLocation = liveLocation;

        await user.save();

        res.json({ success: true, message: 'Profile updated successfully', user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getUserHistory = async (req, res) => {
    try {
        const bookings = await Booking.find({ 
            $or: [
                { userId: req.user.id },
                { email: req.user.email } // Also match existing bookings by email
            ]
        }).sort({ submittedAt: -1 });

        const inquiries = await Inquiry.find({
            $or: [
                { userId: req.user.id },
                { email: req.user.email }
            ]
        }).sort({ submittedAt: -1 });

        res.json({
            success: true,
            bookings,
            inquiries
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Store path to the file
        const imagePath = `/uploads/profiles/${req.file.filename}`;
        user.profileImage = imagePath;
        await user.save();

        res.json({ success: true, message: 'Profile image updated successfully', imagePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

