const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'admin@example.com'
  const password = await bcrypt.hash('admin123', 10)

  await prisma.admin.upsert({
    where: { email },
    update: {},
    create: { email, password, name: 'Primary Admin', status: 'available' },
  })

  console.log('Seed complete: admin@example.com / admin123')

  // create a few more admins
  const admins = [
    { email: 'alice@example.com', name: 'Alice', password: await bcrypt.hash('alice123', 10), status: 'available' },
    { email: 'bob@example.com', name: 'Bob', password: await bcrypt.hash('bob123', 10), status: 'available' },
    { email: 'carol@example.com', name: 'Carol', password: await bcrypt.hash('carol123', 10), status: 'offline' },
  ]

  for (const a of admins) {
    await prisma.admin.upsert({
      where: { email: a.email },
      update: { name: a.name, status: a.status },
      create: { email: a.email, name: a.name, password: a.password, status: a.status },
    })
    console.log(`Seed admin: ${a.email} / (password hidden)`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
