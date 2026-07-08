const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.redistributionSuggestion.deleteMany();
  await prisma.testAudit.deleteMany();
  await prisma.staffAttendance.deleteMany();
  await prisma.bedAvailability.deleteMany();
  await prisma.patientFootfall.deleteMany();
  await prisma.stockTransaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.healthCenter.deleteMany();

  console.log('Seeding health centers...');
  const centersData = [
    { name: 'CHC Rampur', type: 'CHC', address: 'Rampur Road, Main Chauraha, Rampur', district: 'Hoshangabad', latitude: 22.75, longitude: 78.43, contact: '+91-9876543210' },
    { name: 'PHC Pipariya', type: 'PHC', address: 'Pipariya Village, Near Railway Station', district: 'Hoshangabad', latitude: 22.76, longitude: 78.35, contact: '+91-9876543211' },
    { name: 'PHC Gadarwara', type: 'PHC', address: 'Station Road, Gadarwara', district: 'Hoshangabad', latitude: 22.92, longitude: 78.78, contact: '+91-9876543212' },
    { name: 'PHC Babai', type: 'PHC', address: 'Bhopal-Jabalpur Highway, Babai', district: 'Hoshangabad', latitude: 22.70, longitude: 77.93, contact: '+91-9876543213' },
    { name: 'PHC Sohagpur', type: 'PHC', address: 'Sohagpur Town, Near Market', district: 'Hoshangabad', latitude: 22.70, longitude: 78.20, contact: '+91-9876543214' }
  ];

  const centers = [];
  for (const center of centersData) {
    const created = await prisma.healthCenter.create({ data: center });
    centers.push(created);
  }
  const [rampur, pipariya, gadarwara, babai, sohagpur] = centers;

  console.log('Seeding users...');
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const staffPassword = await bcrypt.hash('staff123', salt);
  const doctorPassword = await bcrypt.hash('doctor123', salt);

  const usersData = [
    // District Admin
    { email: 'admin@smarthealth.gov.in', password: adminPassword, name: 'Dr. Rajesh Kumar', role: 'ADMIN', healthCenterId: null },
    // CHC Rampur Staff & Doc
    { email: 'rampur_staff@smarthealth.gov.in', password: staffPassword, name: 'Suresh Patel', role: 'STAFF', healthCenterId: rampur.id },
    { email: 'rampur_doc@smarthealth.gov.in', password: doctorPassword, name: 'Dr. Manoj Verma', role: 'DOCTOR', healthCenterId: rampur.id },
    // PHC Pipariya Staff & Doc
    { email: 'pipariya_staff@smarthealth.gov.in', password: staffPassword, name: 'Anjali Sharma', role: 'STAFF', healthCenterId: pipariya.id },
    { email: 'pipariya_doc@smarthealth.gov.in', password: doctorPassword, name: 'Dr. Sunita Sen', role: 'DOCTOR', healthCenterId: pipariya.id },
    // PHC Gadarwara Staff & Doc
    { email: 'gadarwara_staff@smarthealth.gov.in', password: staffPassword, name: 'Rajesh Chaurasia', role: 'STAFF', healthCenterId: gadarwara.id },
    { email: 'gadarwara_doc@smarthealth.gov.in', password: doctorPassword, name: 'Dr. Anil Mehta', role: 'DOCTOR', healthCenterId: gadarwara.id },
    // PHC Babai Staff & Doc
    { email: 'babai_staff@smarthealth.gov.in', password: staffPassword, name: 'Pradeep Goel', role: 'STAFF', healthCenterId: babai.id },
    { email: 'babai_doc@smarthealth.gov.in', password: doctorPassword, name: 'Dr. Vikrant Kadam', role: 'DOCTOR', healthCenterId: babai.id },
    // PHC Sohagpur Staff & Doc
    { email: 'sohagpur_staff@smarthealth.gov.in', password: staffPassword, name: 'Meena Thakur', role: 'STAFF', healthCenterId: sohagpur.id },
    { email: 'sohagpur_doc@smarthealth.gov.in', password: doctorPassword, name: 'Dr. Pallavi Joshi', role: 'DOCTOR', healthCenterId: sohagpur.id }
  ];

  const users = [];
  for (const u of usersData) {
    const created = await prisma.user.create({ data: u });
    users.push(created);
  }

  console.log('Seeding inventory items & transactions...');
  const itemsPreset = [
    { name: 'Paracetamol 500mg', itemType: 'MEDICINE', unit: 'tablets', minStock: 1000 },
    { name: 'Amoxicillin 250mg', itemType: 'MEDICINE', unit: 'tablets', minStock: 800 },
    { name: 'Metformin 500mg', itemType: 'MEDICINE', unit: 'tablets', minStock: 600 },
    { name: 'ORS Sachet', itemType: 'MEDICINE', unit: 'kits', minStock: 300 },
    { name: 'Dengue NS1 Test Kit', itemType: 'REAGENT', unit: 'kits', minStock: 100 },
    { name: 'Malaria RDT Kit', itemType: 'REAGENT', unit: 'kits', minStock: 100 },
    { name: 'COVID-19 Vaccine (Covishield)', itemType: 'MEDICINE', unit: 'vials', minStock: 50 },
    { name: 'Pregnancy Test Strip', itemType: 'REAGENT', unit: 'units', minStock: 150 },
    { name: 'Disposable Syringes 5ml', itemType: 'EQUIPMENT', unit: 'units', minStock: 1200 }
  ];

  // Map to distribute stocks: CHC Rampur has huge surplus. PHC Pipariya & Sohagpur have severe deficits.
  const stockLevels = {
    [rampur.id]:     { 'Paracetamol 500mg': 5500, 'Amoxicillin 250mg': 3000, 'Metformin 500mg': 2200, 'ORS Sachet': 1800, 'Dengue NS1 Test Kit': 600, 'Malaria RDT Kit': 500, 'COVID-19 Vaccine (Covishield)': 300, 'Pregnancy Test Strip': 800, 'Disposable Syringes 5ml': 6000 },
    [pipariya.id]:   { 'Paracetamol 500mg': 120,  'Amoxicillin 250mg': 100,  'Metformin 500mg': 800,  'ORS Sachet': 40,   'Dengue NS1 Test Kit': 15,  'Malaria RDT Kit': 120, 'COVID-19 Vaccine (Covishield)': 8,   'Pregnancy Test Strip': 20,  'Disposable Syringes 5ml': 1800 },
    [gadarwara.id]:  { 'Paracetamol 500mg': 1200, 'Amoxicillin 250mg': 900,  'Metformin 500mg': 650,  'ORS Sachet': 400,  'Dengue NS1 Test Kit': 110, 'Malaria RDT Kit': 130, 'COVID-19 Vaccine (Covishield)': 60,  'Pregnancy Test Strip': 180, 'Disposable Syringes 5ml': 1400 },
    [babai.id]:      { 'Paracetamol 500mg': 1800, 'Amoxicillin 250mg': 1100, 'Metformin 500mg': 700,  'ORS Sachet': 350,  'Dengue NS1 Test Kit': 120, 'Malaria RDT Kit': 150, 'COVID-19 Vaccine (Covishield)': 80,  'Pregnancy Test Strip': 200, 'Disposable Syringes 5ml': 2500 },
    [sohagpur.id]:   { 'Paracetamol 500mg': 800,  'Amoxicillin 250mg': 150,  'Metformin 500mg': 100,  'ORS Sachet': 150,  'Dengue NS1 Test Kit': 8,   'Malaria RDT Kit': 15,  'COVID-19 Vaccine (Covishield)': 4,   'Pregnancy Test Strip': 130, 'Disposable Syringes 5ml': 800  }
  };

  const inventories = [];
  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 9);

  for (const center of centers) {
    const centerStock = stockLevels[center.id];
    for (const item of itemsPreset) {
      const qty = centerStock[item.name] || 0;
      const inv = await prisma.inventory.create({
        data: {
          healthCenterId: center.id,
          name: item.name,
          itemType: item.itemType,
          unit: item.unit,
          minStock: item.minStock,
          currentStock: qty,
          batchNumber: `BAT-${Math.floor(100000 + Math.random() * 900000)}`,
          expiryDate
        }
      });
      inventories.push(inv);

      // Create a starting transaction
      await prisma.stockTransaction.create({
        data: {
          healthCenterId: center.id,
          inventoryId: inv.id,
          type: 'IN',
          quantity: qty,
          notes: 'Initial Stock Ingestion'
        }
      });
    }
  }

  console.log('Seeding bed availability...');
  const bedPresets = [
    { centerId: rampur.id, beds: [{ type: 'GENERAL', total: 50, occupied: 32 }, { type: 'ICU', total: 10, occupied: 6 }, { type: 'OXYGEN', total: 20, occupied: 14 }] },
    { centerId: pipariya.id, beds: [{ type: 'GENERAL', total: 10, occupied: 8 }, { type: 'ICU', total: 0, occupied: 0 }, { type: 'OXYGEN', total: 2, occupied: 2 }] },
    { centerId: gadarwara.id, beds: [{ type: 'GENERAL', total: 15, occupied: 15 }, { type: 'ICU', total: 0, occupied: 0 }, { type: 'OXYGEN', total: 4, occupied: 4 }] }, // 100% occupied general/oxygen
    { centerId: babai.id, beds: [{ type: 'GENERAL', total: 12, occupied: 4 }, { type: 'ICU', total: 0, occupied: 0 }, { type: 'OXYGEN', total: 2, occupied: 0 }] },
    { centerId: sohagpur.id, beds: [{ type: 'GENERAL', total: 10, occupied: 3 }, { type: 'ICU', total: 0, occupied: 0 }, { type: 'OXYGEN', total: 3, occupied: 1 }] }
  ];

  for (const preset of bedPresets) {
    for (const bed of preset.beds) {
      await prisma.bedAvailability.create({
        data: {
          healthCenterId: preset.centerId,
          type: bed.type,
          totalBeds: bed.total,
          occupiedBeds: bed.occupied
        }
      });
    }
  }

  console.log('Seeding patient footfall history (30 days)...');
  const departments = ['OPD', 'EMERGENCY', 'IPD'];
  const baseFootfalls = {
    [rampur.id]: { OPD: 120, EMERGENCY: 15, IPD: 25 },
    [pipariya.id]: { OPD: 40, EMERGENCY: 5, IPD: 3 },
    [gadarwara.id]: { OPD: 80, EMERGENCY: 12, IPD: 10 },
    [babai.id]: { OPD: 35, EMERGENCY: 4, IPD: 2 },
    [sohagpur.id]: { OPD: 30, EMERGENCY: 3, IPD: 1 }
  };

  // Generate 30 days of data
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday

    // Weekly multiplier: High on Mondays (1), Low on Sundays (0)
    let dayMultiplier = 1.0;
    if (dayOfWeek === 1) dayMultiplier = 1.3; // Monday spike
    else if (dayOfWeek === 2) dayMultiplier = 1.1; // Tuesday high
    else if (dayOfWeek === 0) dayMultiplier = 0.4; // Sunday drop

    for (const center of centers) {
      const base = baseFootfalls[center.id];

      // Gadarwara has an increasing trend (congestion simulation)
      let trendMultiplier = 1.0;
      if (center.id === gadarwara.id) {
        trendMultiplier = 1.0 + (30 - i) * 0.02; // Up to +60% over 30 days
      }

      for (const dept of departments) {
        const baseVal = base[dept];
        const randomFactor = 0.85 + Math.random() * 0.3; // +- 15%
        const count = Math.round(baseVal * dayMultiplier * trendMultiplier * randomFactor);

        await prisma.patientFootfall.create({
          data: {
            healthCenterId: center.id,
            count: count > 0 ? count : 1,
            department: dept,
            date,
            peakHour: dept === 'EMERGENCY' ? 20 : 11 // OPD peaks at 11am, emergency at 8pm
          }
        });
      }

      // Also generate inventory consumption transactions based on footfall to create historical stock depletion!
      // This will make our AI forecasting have historical data to draw a regression line.
      const medicines = inventories.filter(inv => inv.healthCenterId === center.id && inv.itemType === 'MEDICINE');
      for (const med of medicines) {
        // Average consumption is linked to OPD/EMERGENCY footfall
        const footfallTotal = Math.round(base.OPD * dayMultiplier * trendMultiplier);
        // Consumption rate: e.g. 15% of patients get paracetamol, 5% get amoxicillin, etc.
        let rate = 0.1;
        if (med.name.includes('Paracetamol')) rate = 0.4;
        else if (med.name.includes('ORS')) rate = 0.2;
        else if (med.name.includes('Amoxicillin')) rate = 0.15;
        else if (med.name.includes('Metformin')) rate = 0.08;

        const consumedQty = Math.round(footfallTotal * rate * (0.8 + Math.random() * 0.4));
        if (consumedQty > 0) {
          // Log consumption transactions in the past
          await prisma.stockTransaction.create({
            data: {
              healthCenterId: center.id,
              inventoryId: med.id,
              type: 'OUT',
              quantity: consumedQty,
              date,
              notes: 'Daily Patient Dispensation'
            }
          });
        }
      }
    }
  }

  console.log('Seeding staff attendance (last 7 days)...');
  // Find doctors and staff users
  const doctorUsers = users.filter(u => u.role === 'DOCTOR');
  const staffUsers = users.filter(u => u.role === 'STAFF');

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    // Skip Sunday attendance
    if (date.getDay() === 0) continue;

    // Doctor attendance at PHC Pipariya: Doctor was absent on days 3 and 4 ago to trigger absenteeism
    for (const doc of doctorUsers) {
      let status = 'PRESENT';
      let checkIn = new Date(date);
      checkIn.setHours(9, Math.floor(Math.random() * 20), 0); // 9:00 - 9:20 AM

      let checkOut = new Date(date);
      checkOut.setHours(16, Math.floor(Math.random() * 30), 0); // 4:00 - 4:30 PM

      // Pipariya Doctor Absent simulation
      if (doc.email === 'pipariya_doc@smarthealth.gov.in' && (i === 3 || i === 4)) {
        status = 'ABSENT';
        checkIn = null;
        checkOut = null;
      }

      // Sohagpur Doctor on leave simulation
      if (doc.email === 'sohagpur_doc@smarthealth.gov.in' && i === 1) {
        status = 'LEAVE';
        checkIn = null;
        checkOut = null;
      }

      await prisma.staffAttendance.create({
        data: {
          userId: doc.id,
          healthCenterId: doc.healthCenterId,
          date,
          status,
          checkIn,
          checkOut,
          notes: status === 'ABSENT' ? 'Uninformed Absence' : (status === 'LEAVE' ? 'Medical Leave Approved' : 'Regular Shift')
        }
      });
    }

    // Staff attendance
    for (const st of staffUsers) {
      const checkIn = new Date(date);
      checkIn.setHours(8, 45 + Math.floor(Math.random() * 20), 0); // 8:45 - 9:05 AM

      const checkOut = new Date(date);
      checkOut.setHours(17, Math.floor(Math.random() * 15), 0); // 5:00 - 5:15 PM

      await prisma.staffAttendance.create({
        data: {
          userId: st.id,
          healthCenterId: st.healthCenterId,
          date,
          status: 'PRESENT',
          checkIn,
          checkOut,
          notes: 'Regular Shift'
        }
      });
    }
  }

  console.log('Seeding test audits...');
  const testNames = ['Malaria Antigen', 'Dengue NS1', 'Complete Blood Count (CBC)', 'Pregnancy Test'];
  for (const center of centers) {
    for (const testName of testNames) {
      // Link reagent stock from inventory
      let reagentInventoryName = '';
      if (testName.includes('Malaria')) reagentInventoryName = 'Malaria RDT Kit';
      else if (testName.includes('Dengue')) reagentInventoryName = 'Dengue NS1 Test Kit';
      else if (testName.includes('Pregnancy')) reagentInventoryName = 'Pregnancy Test Strip';
      else reagentInventoryName = 'Disposable Syringes 5ml'; // CBC proxy

      const inventoryItem = await prisma.inventory.findFirst({
        where: { healthCenterId: center.id, name: reagentInventoryName }
      });

      const reagentStock = inventoryItem ? inventoryItem.currentStock : 100;
      const isAvailable = reagentStock > 10; // available if reagentStock is > 10

      await prisma.testAudit.create({
        data: {
          healthCenterId: center.id,
          testName,
          isAvailable,
          reagentStock,
          dailyCapacity: center.type === 'CHC' ? 50 : 15
        }
      });
    }
  }

  console.log('Seeding Completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
