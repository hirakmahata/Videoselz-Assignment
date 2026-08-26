/**
 * Demo catalog and historical engagement events for local development.
 * Safe to re-run: no-ops if products already exist unless --reset is passed.
 */
import { prisma } from '../src/db.js';

const PRODUCTS = [
  { name: 'Leather Weekend Bag', price: 18900 },
  { name: 'Ceramic Pour-Over Set', price: 6400 },
  { name: 'Merino Crew Sweater', price: 12800 },
  { name: 'Trail Running Shoes', price: 15600 },
  { name: 'Matte Black Desk Lamp', price: 8900 },
  { name: 'Linen Apron', price: 4200 },
  { name: 'Walnut Cutting Board', price: 7800 },
  { name: 'Insulated Travel Mug', price: 3600 },
];

const VIDEOS = [
  {
    productName: 'Leather Weekend Bag',
    title: 'Pack a long weekend in 60 seconds',
    videoUrl: 'https://cdn.videoselz.example/videos/leather-weekend-bag.mp4',
  },
  {
    productName: 'Leather Weekend Bag',
    title: 'How the bag holds a 13" laptop',
    videoUrl: 'https://cdn.videoselz.example/videos/leather-bag-laptop.mp4',
  },
  {
    productName: 'Ceramic Pour-Over Set',
    title: 'Morning pour-over ritual',
    videoUrl: 'https://cdn.videoselz.example/videos/pour-over-ritual.mp4',
  },
  {
    productName: 'Merino Crew Sweater',
    title: 'Merino drape and stitch close-up',
    videoUrl: 'https://cdn.videoselz.example/videos/merino-crew.mp4',
  },
  {
    productName: 'Trail Running Shoes',
    title: 'Wet-rock grip test on the ridge trail',
    videoUrl: 'https://cdn.videoselz.example/videos/trail-grip-test.mp4',
  },
  {
    productName: 'Trail Running Shoes',
    title: 'Unboxing and first 5K',
    videoUrl: 'https://cdn.videoselz.example/videos/trail-unboxing.mp4',
  },
  {
    productName: 'Matte Black Desk Lamp',
    title: 'Warm vs cool lighting comparison',
    videoUrl: 'https://cdn.videoselz.example/videos/desk-lamp-temps.mp4',
  },
  {
    productName: 'Linen Apron',
    title: 'Saturday sourdough, start to crumb',
    videoUrl: 'https://cdn.videoselz.example/videos/linen-apron-bake.mp4',
  },
  {
    productName: 'Walnut Cutting Board',
    title: 'Oil finish and knife-friendly grain',
    videoUrl: 'https://cdn.videoselz.example/videos/walnut-board.mp4',
  },
  {
    productName: 'Insulated Travel Mug',
    title: 'Commute leak test',
    videoUrl: 'https://cdn.videoselz.example/videos/travel-mug-leak.mp4',
  },
  {
    productName: 'Ceramic Pour-Over Set',
    title: 'Bloom, pour, and serve',
    videoUrl: 'https://cdn.videoselz.example/videos/pour-over-steps.mp4',
  },
  {
    productName: 'Merino Crew Sweater',
    title: 'Layering for a cold market morning',
    videoUrl: 'https://cdn.videoselz.example/videos/merino-layering.mp4',
  },
];

/**
 * Deterministic PRNG so reseeds produce the same event mix.
 * @param {number} seed
 * @returns {() => number}
 */
function mulberry32(seed) {
  return function next() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Funnel-shaped random type: mostly views, fewer clicks, few add-to-carts. */
function pickWeightedEvent(random) {
  const roll = random();
  if (roll < 0.72) return 'view';
  if (roll < 0.92) return 'click';
  return 'add_to_cart';
}

/** @param {number} hours */
function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

/** Inserts products, videos, and a fixed volume of historical events. */
async function seed() {
  const shouldReset = process.argv.includes('--reset');
  const existing = await prisma.product.count();

  if (existing > 0 && !shouldReset) {
    console.log('Database already has products. Re-run with --reset to reseed.');
    return;
  }

  if (shouldReset) {
    await prisma.engagementEvent.deleteMany();
    await prisma.video.deleteMany();
    await prisma.product.deleteMany();
  }

  const productIds = new Map();

  for (const product of PRODUCTS) {
    const created = await prisma.product.create({ data: product });
    productIds.set(product.name, created.id);
  }

  const videoIds = [];
  for (const video of VIDEOS) {
    const created = await prisma.video.create({
      data: {
        productId: productIds.get(video.productName),
        videoUrl: video.videoUrl,
        title: video.title,
      },
    });
    videoIds.push(created.id);
  }

  // Fixed seed + per-video volumes so the leaderboard is interesting
  // and reseeds are reproducible.
  const random = mulberry32(20260826);
  const eventCounts = [420, 180, 310, 260, 390, 140, 220, 175, 95, 150, 240, 80];
  const events = [];

  for (let index = 0; index < videoIds.length; index += 1) {
    for (let n = 0; n < eventCounts[index]; n += 1) {
      events.push({
        videoId: videoIds[index],
        eventType: pickWeightedEvent(random),
        timestamp: hoursAgo(random() * 24 * 21),
      });
    }
  }

  // Batch inserts — thousands of individual create() calls are slow on SQLite.
  const chunkSize = 200;
  for (let i = 0; i < events.length; i += chunkSize) {
    await prisma.engagementEvent.createMany({
      data: events.slice(i, i + chunkSize),
    });
  }

  const [products, videos, eventTotal] = await Promise.all([
    prisma.product.count(),
    prisma.video.count(),
    prisma.engagementEvent.count(),
  ]);

  console.log(`Seeded ${products} products, ${videos} videos, ${eventTotal} events.`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
