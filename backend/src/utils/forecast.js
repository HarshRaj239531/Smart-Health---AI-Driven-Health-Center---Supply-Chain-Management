const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Computes demand forecasting and stock-out projections for a given inventory item.
 * @param {string} inventoryId 
 * @returns {Promise<Object>} Forecast analytics containing daily rate, days remaining, warnings, and projected timeline.
 */
async function generateInventoryForecast(inventoryId) {
  const inventory = await prisma.inventory.findUnique({
    where: { id: inventoryId },
    include: { healthCenter: true }
  });

  if (!inventory) {
    throw new Error('Inventory item not found');
  }

  // Fetch OUT transactions for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const transactions = await prisma.stockTransaction.findMany({
    where: {
      inventoryId,
      type: 'OUT',
      date: { gte: thirtyDaysAgo }
    },
    orderBy: { date: 'asc' }
  });

  // Calculate average daily rate
  const totalConsumed = transactions.reduce((sum, tx) => sum + tx.quantity, 0);
  let dailyRate = totalConsumed / 30;

  // Fallback if no transactions recorded
  if (dailyRate === 0) {
    // Check if current stock is low relative to minStock to assign a default nominal rate
    dailyRate = inventory.minStock / 30; 
  }

  // Calculate days remaining
  let daysRemaining = 999;
  if (dailyRate > 0) {
    daysRemaining = Math.max(0, parseFloat((inventory.currentStock / dailyRate).toFixed(1)));
  }

  // Generate a 15-day projection timeline (historical 15 days + future 15 days)
  const timeline = [];
  
  // Historical 15 days (read from transactions)
  // To make it simple and clean, we aggregate transactions by day
  const histMap = {};
  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    histMap[dateStr] = 0;
  }

  transactions.forEach(tx => {
    const dateStr = tx.date.toISOString().split('T')[0];
    if (histMap[dateStr] !== undefined) {
      histMap[dateStr] += tx.quantity;
    }
  });

  // Back-calculate historical stock levels
  let runningStock = inventory.currentStock;
  const historicalPoints = [];
  
  // We will build the history chronologically.
  // Today's stock is currentStock. Yesterday's stock was currentStock + yesterday's OUT - yesterday's IN (but let's approximate with daily rate for visual simplicity, or actual transaction values)
  const dateKeys = Object.keys(histMap).sort();
  let tempStock = inventory.currentStock;
  
  // Let's project forward from today
  const futurePoints = [];
  for (let i = 0; i <= 15; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dayOfWeek = d.getDay();
    
    // Weekly seasonal modifier: OPD spikes on Monday/Tuesday
    let dayModifier = 1.0;
    if (dayOfWeek === 1) dayModifier = 1.3;
    else if (dayOfWeek === 2) dayModifier = 1.1;
    else if (dayOfWeek === 0) dayModifier = 0.4; // Sunday slow down

    const projectedConsumption = dailyRate * dayModifier;
    tempStock = Math.max(0, tempStock - projectedConsumption);
    
    futurePoints.push({
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      type: 'Projected',
      stock: Math.round(tempStock),
      consumption: Math.round(projectedConsumption)
    });
  }

  // Historical stock reconstructor
  let histStock = inventory.currentStock;
  for (let i = 1; i <= 15; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const consumed = histMap[dateStr] || Math.round(dailyRate);
    histStock = histStock + consumed; // Add back consumption to go backwards
    historicalPoints.unshift({
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      type: 'Historical',
      stock: Math.round(histStock),
      consumption: consumed
    });
  }

  const combinedTimeline = [
    ...historicalPoints,
    {
      date: 'Today',
      type: 'Actual',
      stock: inventory.currentStock,
      consumption: Math.round(dailyRate)
    },
    ...futurePoints.slice(1) // Avoid doubling today
  ];

  // Determine alert status
  let status = 'SAFE';
  let message = 'Stock levels are stable based on current consumption rates.';
  
  if (daysRemaining <= 3) {
    status = 'CRITICAL';
    message = `CRITICAL: Stock-out expected within ${daysRemaining} days. Immediate intervention required!`;
  } else if (daysRemaining <= 7) {
    status = 'WARNING';
    message = `WARNING: Stock is depleting rapidly. Expected stock-out in ${daysRemaining} days.`;
  } else if (inventory.currentStock <= inventory.minStock) {
    status = 'LOW_STOCK';
    message = 'Stock is below the recommended minimum threshold.';
  }

  return {
    inventoryId: inventory.id,
    itemName: inventory.name,
    healthCenterName: inventory.healthCenter.name,
    currentStock: inventory.currentStock,
    minStock: inventory.minStock,
    dailyRate: parseFloat(dailyRate.toFixed(2)),
    daysRemaining,
    status,
    message,
    timeline: combinedTimeline
  };
}

module.exports = {
  generateInventoryForecast
};
