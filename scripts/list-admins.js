const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const admins = await prisma.admin.findMany({ select: { id: true, email: true, name: true, status: true } })
  if (!admins || admins.length === 0) {
    console.log('No admins found in database.')
  } else {
    console.log('Admins:')
    admins.forEach(a => console.log(`${a.id}  |  ${a.email}  |  ${a.name}  |  ${a.status}`))
  }
}

main()
  .catch((e) => {
    console.error('Error listing admins:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
