const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generateInventoryForecast } = require('../utils/forecast');

exports.getDashboardOverview = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const targetCenterId = req.query.healthCenterId;
    const isDistrictView = isAdmin && (!targetCenterId || targetCenterId === 'DISTRICT');

    if (isDistrictView) {
      // 1. Get all health centers
      const centers = await prisma.healthCenter.findMany({
        include: {
          inventories: true,
          beds: true,
          attendance: {
            where: {
              date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
            },
            include: { user: true }
          }
        }
      });
      
      // Assemble district metrics
      let totalBeds = 0;
      let occupiedBeds = 0;
      let totalStockOuts = 0;
      const flaggedCenters = [];

      const centersStatusList = [];

      for (const center of centers) {
        let centerStatus = 'GREEN';
        const reasons = [];

        // Evaluate Beds
        let centerTotalBeds = 0;
        let centerOccupiedBeds = 0;
        center.beds.forEach(b => {
          centerTotalBeds += b.totalBeds;
          centerOccupiedBeds += b.occupiedBeds;
        });
        totalBeds += centerTotalBeds;
        occupiedBeds += centerOccupiedBeds;

        const occupancyRate = centerTotalBeds > 0 ? (centerOccupiedBeds / centerTotalBeds) : 0;
        if (occupancyRate >= 0.90) {
          reasons.push(`High bed occupancy (${Math.round(occupancyRate * 100)}%)`);
          centerStatus = 'ORANGE';
        }

        // Evaluate Critical Stock
        let centerStockouts = 0;
        for (const inv of center.inventories) {
          if (inv.currentStock === 0) {
            centerStockouts++;
            totalStockOuts++;
          } else if (inv.currentStock <= inv.minStock * 0.2) {
            // Very low stock
            centerStockouts++;
          }
        }
        if (centerStockouts > 0) {
          reasons.push(`${centerStockouts} item(s) in critical stock depletion`);
          centerStatus = 'RED';
        }

        // Evaluate Doctor Attendance (last 7 days)
        const doctorAttendance = center.attendance.filter(att => att.user.role === 'DOCTOR');
        const totalDoctorShifts = doctorAttendance.length;
        const absentDoctorShifts = doctorAttendance.filter(att => att.status === 'ABSENT' || att.status === 'LEAVE').length;
        const doctorAbsenteeismRate = totalDoctorShifts > 0 ? (absentDoctorShifts / totalDoctorShifts) : 0;
        if (doctorAbsenteeismRate >= 0.25) {
          reasons.push(`High Doctor absenteeism (${Math.round(doctorAbsenteeismRate * 100)}% shifts absent/leave)`);
          centerStatus = 'RED';
        }

        if (centerStatus !== 'GREEN') {
          flaggedCenters.push({
            id: center.id,
            name: center.name,
            type: center.type,
            status: centerStatus,
            reasons
          });
        }

        centersStatusList.push({
          id: center.id,
          name: center.name,
          type: center.type,
          district: center.district,
          latitude: center.latitude,
          longitude: center.longitude,
          status: centerStatus,
          bedOccupancy: centerTotalBeds > 0 ? Math.round((centerOccupiedBeds / centerTotalBeds) * 100) : 0,
          stockoutCount: centerStockouts
        });
      }

      // Fetch district total footfall today
      const today = new Date();
      today.setHours(0,0,0,0);
      const footfallToday = await prisma.patientFootfall.aggregate({
        where: { date: { gte: today } },
        _sum: { count: true }
      });

      res.json({
        role: 'ADMIN',
        districtSummary: {
          totalCenters: centers.length,
          totalBeds,
          occupiedBeds,
          bedOccupancyPercentage: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
          totalStockOuts,
          patientFootfallToday: footfallToday._sum.count || 0
        },
        flaggedCenters,
        centersList: centersStatusList
      });
    } else {
      // Local PHC/CHC Dashboard Details
      const centerId = isAdmin ? targetCenterId : req.user.healthCenterId;
      const center = await prisma.healthCenter.findUnique({
        where: { id: centerId },
        include: {
          inventories: true,
          beds: true,
          testAudits: true
        }
      });

      // Beds summary
      let totalBeds = 0;
      let occupiedBeds = 0;
      center.beds.forEach(b => {
        totalBeds += b.totalBeds;
        occupiedBeds += b.occupiedBeds;
      });

      // Stock summary
      let criticalItemsCount = 0;
      let warningItemsCount = 0;
      let safeItemsCount = 0;

      for (const inv of center.inventories) {
        if (inv.currentStock <= inv.minStock * 0.2) {
          criticalItemsCount++;
        } else if (inv.currentStock <= inv.minStock) {
          warningItemsCount++;
        } else {
          safeItemsCount++;
        }
      }

      // Past 7 days patient footfall aggregated by day
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const footfalls = await prisma.patientFootfall.findMany({
        where: { healthCenterId: centerId, date: { gte: sevenDaysAgo } },
        orderBy: { date: 'asc' }
      });

      // Format patient footfall chart data
      const footfallMap = {};
      footfalls.forEach(f => {
        const key = f.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        if (!footfallMap[key]) {
          footfallMap[key] = { date: key, OPD: 0, Emergency: 0, IPD: 0 };
        }
        if (f.department === 'OPD') footfallMap[key].OPD += f.count;
        if (f.department === 'EMERGENCY') footfallMap[key].Emergency += f.count;
        if (f.department === 'IPD') footfallMap[key].IPD += f.count;
      });
      const patientChartData = Object.values(footfallMap);

      // Available tests
      const availableTestsCount = center.testAudits.filter(t => t.isAvailable).length;

      res.json({
        role: req.user.role,
        centerDetails: {
          id: center.id,
          name: center.name,
          type: center.type,
          address: center.address,
          contact: center.contact
        },
        bedSummary: {
          totalBeds,
          occupiedBeds,
          availableBeds: totalBeds - occupiedBeds,
          occupancyRate: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0
        },
        inventorySummary: {
          totalItems: center.inventories.length,
          criticalItems: criticalItemsCount,
          warningItems: warningItemsCount,
          safeItems: safeItemsCount
        },
        testsSummary: {
          totalTests: center.testAudits.length,
          availableTests: availableTestsCount
        },
        patientChartData
      });
    }
  } catch (error) {
    console.error('Overview aggregation error:', error);
    res.status(500).json({ message: 'Dashboard data compilation failed' });
  }
};

exports.getBedsStatus = async (req, res) => {
  try {
    let healthCenterId = req.user.healthCenterId;
    if (req.user.role === 'ADMIN' && req.query.healthCenterId) {
      healthCenterId = req.query.healthCenterId;
    }

    if (!healthCenterId) {
      return res.status(400).json({ message: 'Health center is required' });
    }

    const beds = await prisma.bedAvailability.findMany({
      where: { healthCenterId },
      orderBy: { type: 'asc' }
    });

    res.json(beds);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve beds occupancy' });
  }
};

exports.updateBedsStatus = async (req, res) => {
  try {
    const { bedId, occupiedBeds } = req.body;

    if (!bedId || occupiedBeds === undefined || occupiedBeds < 0) {
      return res.status(400).json({ message: 'Valid Bed ID and occupancy required' });
    }

    const bed = await prisma.bedAvailability.findUnique({ where: { id: bedId } });
    if (!bed) return res.status(404).json({ message: 'Bed record not found' });

    if (occupiedBeds > bed.totalBeds) {
      return res.status(400).json({ message: `Occupancy cannot exceed total beds limit (${bed.totalBeds})` });
    }

    const updatedBed = await prisma.bedAvailability.update({
      where: { id: bedId },
      data: { occupiedBeds: parseInt(occupiedBeds) }
    });

    res.json(updatedBed);
  } catch (error) {
    console.error('Update beds error:', error);
    res.status(500).json({ message: 'Failed to update beds' });
  }
};

exports.getTestAudits = async (req, res) => {
  try {
    let healthCenterId = req.user.healthCenterId;
    if (req.user.role === 'ADMIN' && req.query.healthCenterId) {
      healthCenterId = req.query.healthCenterId;
    }

    if (!healthCenterId) {
      return res.status(400).json({ message: 'Health center is required' });
    }

    const tests = await prisma.testAudit.findMany({
      where: { healthCenterId },
      orderBy: { testName: 'asc' }
    });

    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve tests audit' });
  }
};

exports.updateTestAudit = async (req, res) => {
  try {
    const { auditId, isAvailable, reagentStock } = req.body;

    if (!auditId) {
      return res.status(400).json({ message: 'Audit ID required' });
    }

    const test = await prisma.testAudit.findUnique({ where: { id: auditId } });
    if (!test) return res.status(404).json({ message: 'Test audit not found' });

    const updateData = {};
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    if (reagentStock !== undefined && reagentStock >= 0) updateData.reagentStock = parseInt(reagentStock);

    const updatedTest = await prisma.testAudit.update({
      where: { id: auditId },
      data: updateData
    });

    res.json(updatedTest);
  } catch (error) {
    console.error('Update test audit error:', error);
    res.status(500).json({ message: 'Failed to update test audits' });
  }
};
