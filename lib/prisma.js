import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
}

// Helper function to create a new Prisma client
const createPrismaClient = () => {
  const client = new PrismaClient(prismaClientOptions)
  // Connect eagerly to avoid cold start issues
  client.$connect().catch(e => console.log('Prisma connect error:', e.message))
  return client
}

// Use global instance to prevent too many connections
const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Helper function to retry database operations
export async function withRetry(operation, maxRetries = 5) {
  let lastError
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Ensure connection before operation
      await prisma.$connect()
      return await operation()
    } catch (error) {
      lastError = error
      console.log(`Database error (attempt ${i + 1}/${maxRetries}):`, error.code || 'NO_CODE', error.message?.substring(0, 100))
      // Retry on any connection/timeout error
      const shouldRetry = 
        error.code === 'P1001' || 
        error.code === 'P1017' || 
        error.code === 'P1011' || 
        error.code === 'P2024' ||
        error.code === 'P1008' ||
        error.message?.includes('timeout') || 
        error.message?.includes('connect') ||
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('socket')
      
      if (shouldRetry && i < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000) // Exponential backoff, max 10s
        console.log(`Retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        // Try to reconnect
        try { await prisma.$disconnect() } catch {}
        continue
      }
      throw error
    }
  }
  throw lastError
}

export default prisma
