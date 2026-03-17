import { vi, beforeAll, afterAll } from 'vitest';
import { prisma } from '../src/utils/prisma';

beforeAll(async () => {
  // Add global setup here if needed (e.g., global mocks, database setup)
  console.log("🧪 Setting up tests...");
});

afterAll(async () => {
  // Disconnect from the database after all tests to avoid connection leakage
  await prisma.$disconnect();
  console.log("Tests completed.");
});
