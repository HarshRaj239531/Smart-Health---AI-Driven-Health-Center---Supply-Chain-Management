const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAttendance = async (req, res) => {
  try {
    let healthCenterId = req.user.healthCenterId;
    if (req.user.role === 'ADMIN' && req.query.healthCenterId) {
      healthCenterId = req.query.healthCenterId;
    }

    if (!healthCenterId) {
      return res.status(400).json({ message: 'Health center is required' });
    }

    // Default to today
    const dateParam = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(dateParam);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(dateParam);
    endOfDay.setHours(23,59,59,999);

    // Get all users registered at this health center (Doctors + Staff)
    const staffMembers = await prisma.user.findMany({
      where: { healthCenterId, role: { in: ['STAFF', 'DOCTOR'] } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    // Get attendance records for this center and day
    const records = await prisma.staffAttendance.findMany({
      where: {
        healthCenterId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Map records to staff members
    const result = staffMembers.map(staff => {
      const record = records.find(r => r.userId === staff.id);
      return {
        userId: staff.id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        status: record ? record.status : 'ABSENT',
        checkIn: record ? record.checkIn : null,
        checkOut: record ? record.checkOut : null,
        attendanceId: record ? record.id : null,
        notes: record ? record.notes : 'Not clocked in today'
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Failed to retrieve attendance logs' });
  }
};

exports.clockInSimulator = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const staffMember = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!staffMember || !staffMember.healthCenterId) {
      return res.status(404).json({ message: 'Staff member or associated health center not found' });
    }

    // Biometric simulator logs for today
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0,0,0,0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23,59,59,999);

    // Look for existing attendance today
    const existing = await prisma.staffAttendance.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    let record;
    if (!existing) {
      // Clock In
      record = await prisma.staffAttendance.create({
        data: {
          userId,
          healthCenterId: staffMember.healthCenterId,
          date: today,
          checkIn: today,
          status: 'PRESENT',
          notes: 'Clocked In via Scanner Simulator'
        }
      });
    } else if (existing.checkIn && !existing.checkOut) {
      // Clock Out
      record = await prisma.staffAttendance.update({
        where: { id: existing.id },
        data: {
          checkOut: today,
          notes: 'Clocked Out via Scanner Simulator'
        }
      });
    } else {
      // Already checked out, reset for testability
      record = await prisma.staffAttendance.update({
        where: { id: existing.id },
        data: {
          checkIn: today,
          checkOut: null,
          status: 'PRESENT',
          notes: 'Re-Clocked In via Simulator'
        }
      });
    }

    res.json(record);
  } catch (error) {
    console.error('Clock simulator error:', error);
    res.status(500).json({ message: 'Biometric simulation failed' });
  }
};
