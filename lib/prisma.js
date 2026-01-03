import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
}

// Helper function to create a new Prisma client with retry logic
const createPrismaClient = () => {
  const client = new PrismaClient(prismaClientOptions)
  return client
}

const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to retry database operations
export async function withRetry(operation, maxRetries = 3) {
  let lastError
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      // Only retry on connection errors
      if (error.code === 'P1001' || error.code === 'P1017' || error.code === 'P1011') {
        console.log(`Database connection error (attempt ${i + 1}/${maxRetries}), retrying...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
        continue
      }
      throw error
    }
  }
  throw lastError
}

export default prisma
