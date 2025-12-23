const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@example.com'
  const password = await bcrypt.hash('admin123', 10)

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, password },
  })

  console.log('Seed complete: admin@example.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
