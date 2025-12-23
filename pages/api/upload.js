import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { image, filename } = req.body

    if (!image || !filename) {
      return res.status(400).json({ error: 'Image and filename required' })
    }

    // Validate it's an image
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Only image files allowed' })
    }

    // Extract base64 data
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    // Check size (5MB limit)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Image must be under 5 MB' })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const ext = filename.split('.').pop() || 'png'
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
    const filePath = path.join(uploadsDir, uniqueName)

    // Write file
    fs.writeFileSync(filePath, buffer)

    // Return public URL
    const url = `/uploads/${uniqueName}`
    return res.status(200).json({ url })
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ error: 'Upload failed' })
  }
}
