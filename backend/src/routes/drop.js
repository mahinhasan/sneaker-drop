const express = require('express');
const router = express.Router();
const { createDropController, getDropsController } = require('../controllers/dropController');

router.post('/', createDropController);
router.get('/', getDropsController);

module.exports = router;
