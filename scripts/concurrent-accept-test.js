const fetch = require('node-fetch')

async function tryAccept(orderId, adminId) {
  try {
    const res = await fetch(`http://localhost:3000/api/orders/${orderId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    })
    const json = await res.json()
    console.log(`Admin ${adminId} -> status ${res.status}`, json)
  } catch (e) {
    console.error(e)
  }
}

async function run() {
  const orderId = process.argv[2]
  const admin1 = process.argv[3] || 'admin1'
  const admin2 = process.argv[4] || 'admin2'
  const admin3 = process.argv[5] || 'admin3'
  if (!orderId) return console.error('Usage: node concurrent-accept-test.js <orderId> <admin1> <admin2> <admin3>')

  await Promise.all([
    tryAccept(orderId, admin1),
    tryAccept(orderId, admin2),
    tryAccept(orderId, admin3),
  ])
}

run()
