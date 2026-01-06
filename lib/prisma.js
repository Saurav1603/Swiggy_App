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
export async function withRetry(operation, maxRetries = 5) {
  let lastError
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      console.log(`Database error (attempt ${i + 1}/${maxRetries}):`, error.code, error.message)
      // Retry on connection errors or timeout
      if (error.code === 'P1001' || error.code === 'P1017' || error.code === 'P1011' || error.code === 'P2024' || error.message?.includes('timeout') || error.message?.includes('connect')) {
        console.log(`Retrying in ${(i + 1) * 2} seconds...`)
        await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)))
        continue
      }
      throw error
    }
  }
  throw lastError
}

export default prisma
