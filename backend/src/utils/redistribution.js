const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper to calculate distance using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return parseFloat(d.toFixed(1));
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Sweeps the database for deficit inventory items and matches them with surplus centers.
 * It inserts or updates the RedistributionSuggestion model.
 */
async function generateRedistributionSuggestions() {
  // Get all inventory items that are in deficit
  const deficits = await prisma.inventory.findMany({
    where: {
      currentStock: {
        lte: prisma.raw('inventory."minStock"') // Under or equal to min stock
      }
    },
    include: {
      healthCenter: true
    }
  });

  const suggestions = [];

  for (const targetInventory of deficits) {
    const targetCenter = targetInventory.healthCenter;
    const itemName = targetInventory.name;

    // Calculate consumption rate for target
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const targetTransactions = await prisma.stockTransaction.findMany({
      where: { inventoryId: targetInventory.id, type: 'OUT', date: { gte: thirtyDaysAgo } }
    });
    const totalConsumed = targetTransactions.reduce((sum, tx) => sum + tx.quantity, 0);
    const dailyRate = totalConsumed / 30;
    const daysRemaining = dailyRate > 0 ? (targetInventory.currentStock / dailyRate) : 99;

    // Find all centers that have a surplus of this item
    const potentialSources = await prisma.inventory.findMany({
      where: {
        name: itemName,
        currentStock: {
          gt: prisma.raw('inventory."minStock" * 1.5') // Significant surplus
        },
        healthCenterId: {
          not: targetCenter.id // Not the same center
        }
      },
      include: {
        healthCenter: true
      }
    });

    for (const sourceInventory of potentialSources) {
      const sourceCenter = sourceInventory.healthCenter;
      
      const distance = calculateDistance(
        sourceCenter.latitude, sourceCenter.longitude,
        targetCenter.latitude, targetCenter.longitude
      );

      // We only consider transfers within a reasonable district distance, e.g. 100km
      if (distance > 100) continue;

      const surplusAvailable = Math.floor(sourceInventory.currentStock - (sourceInventory.minStock * 1.2)); // Keep safety margin of 20% over minStock
      const deficitNeeded = targetInventory.minStock - targetInventory.currentStock;

      if (surplusAvailable > 0 && deficitNeeded > 0) {
        const transferQty = Math.min(surplusAvailable, deficitNeeded);
        
        let urgency = 'LOW';
        if (daysRemaining <= 3) urgency = 'HIGH';
        else if (daysRemaining <= 7) urgency = 'MEDIUM';

        // Check if suggestion already exists and is pending
        const existingSuggestion = await prisma.redistributionSuggestion.findFirst({
          where: {
            sourceCenterId: sourceCenter.id,
            targetCenterId: targetCenter.id,
            inventoryId: targetInventory.id,
            status: 'PENDING'
          }
        });

        if (existingSuggestion) {
          // Update details
          const updated = await prisma.redistributionSuggestion.update({
            where: { id: existingSuggestion.id },
            data: {
              quantity: transferQty,
              urgency,
              itemName
            },
            include: {
              sourceCenter: true,
              targetCenter: true
            }
          });
          suggestions.push(updated);
        } else {
          // Create new suggestion
          const created = await prisma.redistributionSuggestion.create({
            data: {
              sourceCenterId: sourceCenter.id,
              targetCenterId: targetCenter.id,
              inventoryId: targetInventory.id,
              itemName,
              quantity: transferQty,
              urgency,
              status: 'PENDING'
            },
            include: {
              sourceCenter: true,
              targetCenter: true
            }
          });
          suggestions.push(created);
        }
      }
    }
  }

  return suggestions;
}

module.exports = {
  generateRedistributionSuggestions
};
