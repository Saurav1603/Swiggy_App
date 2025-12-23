import cloudinary from '../../lib/cloudinary'

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

    // Upload to Cloudinary
    const uploadStr = `data:image/${filename.split('.').pop()};base64,${base64Data}`;
    const uploadRes = await cloudinary.uploader.upload(uploadStr, {
      folder: 'swiggy_uploads',
      public_id: filename.split('.')[0],
      overwrite: false,
    });
    return res.status(200).json({ url: uploadRes.secure_url });
  } catch (err) {
    console.error('Upload error:', err)
    return res.status(500).json({ error: 'Upload failed' })
  }
}
