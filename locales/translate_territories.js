const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const communes = [
    { id: 1, nomArabe: 'مديونة' },
    { id: 2, nomArabe: 'تيط مليل' },
    { id: 3, nomArabe: 'الهراويين' },
    { id: 4, nomArabe: 'سيدي حجاج' },
    { id: 5, nomArabe: 'مجاطية' },
  ];

  const annexes = [
    { id: 7, nomArabe: 'الملحقة الإدارية أولاد ملوك' },
    { id: 8, nomArabe: 'الملحقة الإدارية البساتين' },
    { id: 9, nomArabe: 'مركز المجاطية' },
    { id: 10, nomArabe: 'الملحقة الإدارية الرشاد' },
    { id: 11, nomArabe: 'الملحقة الإدارية الحمد' },
    { id: 12, nomArabe: 'الملحقة الإدارية أبرار' },
    { id: 13, nomArabe: 'الملحقة الإدارية الزرقطوني' },
    { id: 3, nomArabe: 'الملحقة الإدارية بدر' },
    { id: 4, nomArabe: 'الملحقة الإدارية الرحمة' },
    { id: 5, nomArabe: 'الملحقة الإدارية حاج موسى' },
    { id: 6, nomArabe: 'الملحقة الإدارية المدينة الجديدة' },
    { id: 2, nomArabe: 'الملحقة الإدارية نصر الله' },
    { id: 14, nomArabe: 'الملحقة الإدارية الرياض' },
    { id: 15, nomArabe: 'الملحقة الإدارية أولاد حدة' },
    { id: 16, nomArabe: 'الملحقة الإدارية شمس المدينة' },
    { id: 17, nomArabe: 'الملحقة الإدارية عليا بدر' },
    { id: 18, nomArabe: 'مركز سيدي حجاج' },
    { id: 1, nomArabe: 'الملحقة الإدارية الحي الصناعي' },
    { id: 19, nomArabe: 'الملحقة الإدارية حلهال الهراويين' },
  ];

  console.log('Update Communes...');
  for (const c of communes) {
    await prisma.commune.update({
      where: { id: c.id },
      data: { nomArabe: c.nomArabe },
    });
  }

  console.log('Update Annexes...');
  for (const a of annexes) {
    await prisma.annexe.update({
      where: { id: a.id },
      data: { nomArabe: a.nomArabe },
    });
  }

  console.log('✅ All communes and annexes translated in database.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
