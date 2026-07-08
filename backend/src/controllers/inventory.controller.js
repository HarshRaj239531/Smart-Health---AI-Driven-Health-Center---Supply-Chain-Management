const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateInventoryForecast } = require('../utils/forecast');

exports.getInventory = async (req, res) => {
  try {
    let healthCenterId = req.user.healthCenterId;

    // Admin can specify healthCenterId via query param
    if (req.user.role === 'ADMIN' && req.query.healthCenterId) {
      healthCenterId = req.query.healthCenterId;
    }

    if (!healthCenterId) {
      return res.status(400).json({ message: 'Health Center ID is required' });
    }

    const inventory = await prisma.inventory.findMany({
      where: { healthCenterId },
      orderBy: { name: 'asc' }
    });

    res.json(inventory);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Failed to fetch inventory' });
  }
};

exports.logConsumption = async (req, res) => {
  try {
    const { inventoryId, quantity, notes } = req.body;
    let healthCenterId = req.user.healthCenterId;

    if (!inventoryId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid Inventory ID and positive quantity required' });
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Authorization check
    if (req.user.role !== 'ADMIN' && req.user.healthCenterId !== inventory.healthCenterId) {
      return res.status(403).json({ message: 'Unauthorized to modify this inventory' });
    }

    healthCenterId = inventory.healthCenterId;

    if (inventory.currentStock < quantity) {
      return res.status(400).json({ message: `Insufficient stock. Current: ${inventory.currentStock}` });
    }

    // Decrement stock and log transaction in prisma transaction
    const [updatedInv, tx] = await prisma.$transaction([
      prisma.inventory.update({
        where: { id: inventoryId },
        data: { currentStock: { decrement: parseInt(quantity) } }
      }),
      prisma.stockTransaction.create({
        data: {
          healthCenterId,
          inventoryId,
          type: 'OUT',
          quantity: parseInt(quantity),
          notes: notes || 'Manual Consumption Log'
        }
      })
    ]);

    res.json({ inventory: updatedInv, transaction: tx });
  } catch (error) {
    console.error('Log consumption error:', error);
    res.status(500).json({ message: 'Failed to log consumption' });
  }
};

exports.addStock = async (req, res) => {
  try {
    const { inventoryId, quantity, notes, batchNumber } = req.body;

    if (!inventoryId || !quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Valid Inventory ID and positive quantity required' });
    }

    const inventory = await prisma.inventory.findUnique({
      where: { id: inventoryId }
    });

    if (!inventory) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    // Authorization check
    if (req.user.role !== 'ADMIN' && req.user.healthCenterId !== inventory.healthCenterId) {
      return res.status(403).json({ message: 'Unauthorized to modify this inventory' });
    }

    const updateData = { currentStock: { increment: parseInt(quantity) } };
    if (batchNumber) {
      updateData.batchNumber = batchNumber;
    }

    const [updatedInv, tx] = await prisma.$transaction([
      prisma.inventory.update({
        where: { id: inventoryId },
        data: updateData
      }),
      prisma.stockTransaction.create({
        data: {
          healthCenterId: inventory.healthCenterId,
          inventoryId,
          type: 'IN',
          quantity: parseInt(quantity),
          notes: notes || 'Stock Replenishment'
        }
      })
    ]);

    res.json({ inventory: updatedInv, transaction: tx });
  } catch (error) {
    console.error('Add stock error:', error);
    res.status(500).json({ message: 'Failed to replenish stock' });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    let healthCenterId = req.user.healthCenterId;

    if (req.user.role === 'ADMIN' && req.query.healthCenterId) {
      healthCenterId = req.query.healthCenterId;
    }

    if (!healthCenterId) {
      return res.status(400).json({ message: 'Health Center ID is required' });
    }

    const transactions = await prisma.stockTransaction.findMany({
      where: { healthCenterId },
      include: {
        inventory: true
      },
      orderBy: { date: 'desc' },
      take: 50 // Limit to last 50
    });

    res.json(transactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Failed to fetch transaction logs' });
  }
};

exports.getItemForecast = async (req, res) => {
  try {
    const { inventoryId } = req.params;

    if (!inventoryId) {
      return res.status(400).json({ message: 'Inventory ID is required' });
    }

    const forecast = await generateInventoryForecast(inventoryId);
    res.json(forecast);
  } catch (error) {
    console.error('Forecast error:', error);
    res.status(500).json({ message: error.message || 'Failed to compute forecast' });
  }
};
