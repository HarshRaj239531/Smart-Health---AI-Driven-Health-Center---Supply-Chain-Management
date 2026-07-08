const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateRedistributionSuggestions } = require('../utils/redistribution');

exports.getSuggestions = async (req, res) => {
  try {
    // Regenerate recommendations based on current inventory
    await generateRedistributionSuggestions();

    let suggestions;

    if (req.user.role === 'ADMIN') {
      // Admin sees all suggestions in the district
      suggestions = await prisma.redistributionSuggestion.findMany({
        include: {
          sourceCenter: true,
          targetCenter: true
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Local centers see suggestions where they are source or target
      const centerId = req.user.healthCenterId;
      suggestions = await prisma.redistributionSuggestion.findMany({
        where: {
          OR: [
            { sourceCenterId: centerId },
            { targetCenterId: centerId }
          ]
        },
        include: {
          sourceCenter: true,
          targetCenter: true
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json(suggestions);
  } catch (error) {
    console.error('Get redistribution suggestions error:', error);
    res.status(500).json({ message: 'Failed to compile resource redistribution routes' });
  }
};

exports.approveSuggestion = async (req, res) => {
  try {
    const { suggestionId } = req.body;

    if (!suggestionId) {
      return res.status(400).json({ message: 'Suggestion ID is required' });
    }

    // Retrieve suggestion
    const suggestion = await prisma.redistributionSuggestion.findUnique({
      where: { id: suggestionId },
      include: {
        sourceCenter: true,
        targetCenter: true
      }
    });

    if (!suggestion) {
      return res.status(404).json({ message: 'Redistribution suggestion not found' });
    }

    if (suggestion.status !== 'PENDING') {
      return res.status(400).json({ message: `Suggestion has already been ${suggestion.status}` });
    }

    // Fetch matching inventory items for source and target
    const sourceInv = await prisma.inventory.findFirst({
      where: { healthCenterId: suggestion.sourceCenterId, name: suggestion.itemName }
    });

    const targetInv = await prisma.inventory.findFirst({
      where: { healthCenterId: suggestion.targetCenterId, name: suggestion.itemName }
    });

    if (!sourceInv || !targetInv) {
      return res.status(404).json({ message: 'Matching inventory records not found for source or target' });
    }

    if (sourceInv.currentStock < suggestion.quantity) {
      return res.status(400).json({
        message: `Insufficient stock at source center (${suggestion.sourceCenter.name}). Available: ${sourceInv.currentStock}, Requested: ${suggestion.quantity}`
      });
    }

    // Execute atomic transaction for stock transfer
    const result = await prisma.$transaction(async (tx) => {
      // 1. Decrement source stock
      const updatedSource = await tx.inventory.update({
        where: { id: sourceInv.id },
        data: { currentStock: { decrement: suggestion.quantity } }
      });

      // 2. Increment target stock
      const updatedTarget = await tx.inventory.update({
        where: { id: targetInv.id },
        data: { currentStock: { increment: suggestion.quantity } }
      });

      // 3. Log Source transaction (TRANSFER_OUT)
      await tx.stockTransaction.create({
        data: {
          healthCenterId: suggestion.sourceCenterId,
          inventoryId: sourceInv.id,
          type: 'TRANSFER_OUT',
          quantity: suggestion.quantity,
          referenceCenterId: suggestion.targetCenterId,
          notes: `Redistribution to ${suggestion.targetCenter.name}`
        }
      });

      // 4. Log Target transaction (TRANSFER_IN)
      await tx.stockTransaction.create({
        data: {
          healthCenterId: suggestion.targetCenterId,
          inventoryId: targetInv.id,
          type: 'TRANSFER_IN',
          quantity: suggestion.quantity,
          referenceCenterId: suggestion.sourceCenterId,
          notes: `Redistribution from ${suggestion.sourceCenter.name}`
        }
      });

      // 5. Update suggestion status
      const updatedSuggestion = await tx.redistributionSuggestion.update({
        where: { id: suggestionId },
        data: { status: 'APPROVED' },
        include: {
          sourceCenter: true,
          targetCenter: true
        }
      });

      return updatedSuggestion;
    });

    res.json({ message: 'Resource redistributed successfully', suggestion: result });
  } catch (error) {
    console.error('Approve transfer error:', error);
    res.status(500).json({ message: error.message || 'Failed to process redistribution transfer' });
  }
};

exports.rejectSuggestion = async (req, res) => {
  try {
    const { suggestionId } = req.body;

    if (!suggestionId) {
      return res.status(400).json({ message: 'Suggestion ID is required' });
    }

    const suggestion = await prisma.redistributionSuggestion.findUnique({
      where: { id: suggestionId }
    });

    if (!suggestion) {
      return res.status(404).json({ message: 'Suggestion not found' });
    }

    const updated = await prisma.redistributionSuggestion.update({
      where: { id: suggestionId },
      data: { status: 'REJECTED' }
    });

    res.json({ message: 'Suggestion rejected successfully', suggestion: updated });
  } catch (error) {
    console.error('Reject transfer error:', error);
    res.status(500).json({ message: 'Failed to reject suggestion' });
  }
};
