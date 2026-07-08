const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventory.controller');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, inventoryController.getInventory);
router.post('/consume', authenticate, inventoryController.logConsumption);
router.post('/replenish', authenticate, inventoryController.addStock);
router.get('/transactions', authenticate, inventoryController.getTransactions);
router.get('/:inventoryId/forecast', authenticate, inventoryController.getItemForecast);

module.exports = router;
