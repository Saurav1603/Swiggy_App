import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'public', 'admin-payment.json');

export default async function handler(req, res) {
  if (req.method === 'GET') {
    if (fs.existsSync(DATA_PATH)) {
      const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
      res.json(data);
    } else {
      res.json({ upiId: '', qrUrl: '' });
    }
  } else if (req.method === 'POST') {
    const { upiId, qrUrl } = req.body;
    fs.writeFileSync(DATA_PATH, JSON.stringify({ upiId, qrUrl }));
    res.json({ success: true });
  } else {
    res.status(405).end();
  }
}
