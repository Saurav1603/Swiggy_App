import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const form = new formidable.IncomingForm();
  form.uploadDir = path.join(process.cwd(), 'public', 'uploads');
  form.keepExtensions = true;
  form.maxFileSize = 5 * 1024 * 1024;
  if (!fs.existsSync(form.uploadDir)) fs.mkdirSync(form.uploadDir, { recursive: true });
  form.parse(req, (err, fields, files) => {
    if (err) return res.status(400).json({ error: 'Upload failed' });
    const file = files.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    const url = '/uploads/' + path.basename(file.path);
    res.json({ url });
  });
}
