import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create example games
  const game1 = await prisma.game.upsert({
    where: { steamAppId: 730 },
    update: {},
    create: {
      steamAppId: 730,
      name: 'Counter-Strike 2',
    },
  });

  const game2 = await prisma.game.upsert({
    where: { steamAppId: 570 },
    update: {},
    create: {
      steamAppId: 570,
      name: 'Dota 2',
    },
  });

  const game3 = await prisma.game.upsert({
    where: { steamAppId: 1091500 },
    update: {},
    create: {
      steamAppId: 1091500,
      name: 'Cyberpunk 2077',
    },
  });

  // Create watches
  await prisma.watch.upsert({
    where: { id: 1 },
    update: {},
    create: {
      gameId: game1.id,
      enabled: true,
      discountThreshold: 50,
      priceThresholdEnabled: false,
    },
  });

  await prisma.watch.upsert({
    where: { id: 2 },
    update: {},
    create: {
      gameId: game2.id,
      enabled: true,
      discountThreshold: 30,
      priceThresholdEnabled: false,
    },
  });

  await prisma.watch.upsert({
    where: { id: 3 },
    update: {},
    create: {
      gameId: game3.id,
      enabled: true,
      discountThreshold: 50,
      priceThresholdEnabled: true,
      priceThresholdCents: 15000,
    },
  });

  console.log('Seed completed:', { game1, game2, game3 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
