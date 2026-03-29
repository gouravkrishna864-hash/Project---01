const express = require('express');
const { authenticate } = require('../middleware/auth');
const { getPresignedUrl, deleteMedia } = require('../controllers/uploadController');

const router = express.Router();

// All upload routes require authentication
router.use(authenticate);

router.post('/presign', getPresignedUrl);
router.delete('/:key(*)', deleteMedia);

module.exports = router;
