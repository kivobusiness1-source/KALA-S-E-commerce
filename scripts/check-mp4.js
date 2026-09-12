require('dotenv').config({ override: true });
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
(async () => {
  const all = await db.siteSetting.findMany();
  for (const s of all) {
    if (s.value && s.value.includes('.mp4')) console.log('SETTING', s.key, ':', s.value.slice(0, 150));
  }
  await db.$disconnect();
})();
