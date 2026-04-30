import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clean existing data (in reverse dependency order)
  await prisma.experimentEntry.deleteMany();
  await prisma.experimentCulture.deleteMany();
  await prisma.experiment.deleteMany();
  await prisma.actionLog.deleteMany();
  await prisma.container.deleteMany();
  await prisma.mediaBatch.deleteMany();
  await prisma.mediaRecipe.deleteMany();
  await prisma.cultureType.deleteMany();
  await prisma.containerType.deleteMany();
  await prisma.employee.deleteMany();

  // Employees — "System" is the default attribution for unassigned actions.
  await prisma.employee.create({
    data: { name: 'System', isActive: true },
  });
  const emp1 = await prisma.employee.create({
    data: { name: 'Alice Kim', isActive: true },
  });
  const emp2 = await prisma.employee.create({
    data: { name: 'Bob Park', isActive: true },
  });

  // Container Types
  await prisma.containerType.create({
    data: { name: 'Glass Jar', size: '500ml', material: 'glass', isVented: false, isReusable: true },
  });
  await prisma.containerType.create({
    data: { name: 'Plastic Vessel', size: '1L', material: 'polycarbonate', isVented: true, isReusable: true },
  });

  // Culture Types
  const ct1 = await prisma.cultureType.create({
    data: { name: 'Monstera Deliciosa', species: 'Monstera deliciosa', defaultSubcultureInterval: 28 },
  });
  await prisma.cultureType.create({
    data: { name: 'Philodendron Pink Princess', species: 'Philodendron erubescens', defaultSubcultureInterval: 21 },
  });
  await prisma.cultureType.create({
    data: { name: 'Anthurium Crystallinum', species: 'Anthurium crystallinum', defaultSubcultureInterval: 35 },
  });

  // Media Recipes
  const recipe1 = await prisma.mediaRecipe.create({
    data: {
      name: 'Monstera Multiplication Mix',
      baseType: 'MS',
      phLevel: 5.7,
      agar: 7.0,
      hormones: JSON.stringify({ BAP: '5.00mg', NAA: '0.50mg' }),
    },
  });
  const recipe2 = await prisma.mediaRecipe.create({
    data: {
      name: 'Philodendron Rooting Mix',
      baseType: 'MS',
      phLevel: 5.8,
      agar: 7.0,
      hormones: JSON.stringify({ IBA: '1.00mg' }),
    },
  });

  // Media Batches
  const batch1 = await prisma.mediaBatch.create({
    data: { recipeId: recipe1.id, batchNumber: 'MB-001' },
  });
  const batch2 = await prisma.mediaBatch.create({
    data: { recipeId: recipe2.id, batchNumber: 'MB-002' },
  });

  // Containers
  const now = new Date();
  const due = new Date(now);
  due.setDate(due.getDate() + 28);

  await prisma.container.create({ data: { qrCode: '1000', status: 'HAS_MEDIA', mediaId: batch1.id } });
  await prisma.container.create({ data: { qrCode: '1001', status: 'HAS_MEDIA', mediaId: batch1.id } });
  await prisma.container.create({
    data: {
      qrCode: '1002', status: 'HAS_CULTURE', mediaId: batch1.id, cultureId: ct1.id,
      cultureDate: now, subcultureInterval: 28, dueSubcultureDate: due,
    },
  });
  await prisma.container.create({
    data: {
      qrCode: '1003', status: 'HAS_CULTURE', mediaId: batch1.id, cultureId: ct1.id, parentId: '1002',
      cultureDate: now, subcultureInterval: 28, dueSubcultureDate: due,
    },
  });
  await prisma.container.create({ data: { qrCode: '1004', status: 'EMPTY' } });
  await prisma.container.create({ data: { qrCode: '1005', status: 'EMPTY' } });
  await prisma.container.create({ data: { qrCode: '1006', status: 'DISCARDED' } });
  await prisma.container.create({ data: { qrCode: '1007', status: 'HAS_MEDIA', mediaId: batch2.id } });
  await prisma.container.create({ data: { qrCode: '1008', status: 'EMPTY' } });
  await prisma.container.create({ data: { qrCode: '1009', status: 'EMPTY' } });

  // Action Logs (with status transitions)
  await prisma.actionLog.create({
    data: {
      action: 'PREPARE_MEDIA', performedBy: emp1.id, containerQr: '1000',
      previousStatus: 'EMPTY', newStatus: 'HAS_MEDIA',
      note: 'Poured Monstera Multiplication Mix batch',
    },
  });
  await prisma.actionLog.create({
    data: {
      action: 'PREPARE_MEDIA', performedBy: emp1.id, containerQr: '1001',
      previousStatus: 'EMPTY', newStatus: 'HAS_MEDIA',
      note: 'Poured Monstera Multiplication Mix batch',
    },
  });
  await prisma.actionLog.create({
    data: {
      action: 'ADD_CULTURE', performedBy: emp2.id, containerQr: '1002',
      previousStatus: 'HAS_MEDIA', newStatus: 'HAS_CULTURE',
      note: 'Inoculated with Monstera Deliciosa explant',
    },
  });
  await prisma.actionLog.create({
    data: {
      action: 'ADD_CULTURE', performedBy: emp2.id, containerQr: '1003',
      previousStatus: 'HAS_MEDIA', newStatus: 'HAS_CULTURE',
      note: 'Subculture from container 1002',
    },
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
