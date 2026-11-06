const express = require('express');
const health = require('./health.routes');

const router = express.Router();
router.use('/health', health);

module.exports = router;
