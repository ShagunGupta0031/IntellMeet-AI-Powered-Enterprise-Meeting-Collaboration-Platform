const express = require('express');
const { askCoach } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/coach', askCoach);

module.exports = router;
