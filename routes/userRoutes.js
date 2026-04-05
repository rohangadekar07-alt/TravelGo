const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');

const upload = require('../middleware/upload');

router.get('/profile', authMiddleware, userController.getProfile);
router.put('/profile', authMiddleware, userController.updateProfile);
router.post('/upload-image', authMiddleware, upload.single('profileImage'), userController.uploadProfileImage);
router.get('/history', authMiddleware, userController.getUserHistory);

module.exports = router;
