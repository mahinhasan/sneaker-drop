const express = require('express');
const router = express.Router();
const { createDrop, getDrops } = require('../controllers/dropController');

router.post('/', createDrop);
router.get('/', getDrops);

module.exports = router;
