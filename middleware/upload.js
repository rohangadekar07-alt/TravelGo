const multer = require('multer');
const path = require('path');
const fs = require('fs');

// memoryStorage is required for Vercel/Serverless environments
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

module.exports = upload;
