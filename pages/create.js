import { useState, useRef } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import toast from 'react-hot-toast'

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

export default function CreateRequest() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const [form, setForm] = useState({ name: '', address: '', notes: '' })
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      toast.error('Only image files allowed')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result)
    reader.readAsDataURL(f)
  }

  const removeFile = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  const uploadImage = async () => {
    if (CLOUD_NAME && UPLOAD_PRESET) {
      const data = new FormData()
      data.append('file', file)
      data.append('upload_preset', UPLOAD_PRESET)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: data,
      })
      const json = await res.json()
      return json.secure_url
    } else {
      const base64 = await fileToBase64(file)
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, filename: file.name }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      return json.url
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Please enter your name')
      return
    }
    if (!form.address.trim()) {
      toast.error('Please enter delivery address')
      return
    }
    if (!file) {
      toast.error('Please upload a cart screenshot')
      return
    }

    try {
      setUploading(true)
      const cartImageUrl = await uploadImage()
      setUploading(false)

      setSubmitting(true)
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cartImageUrl }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')

      toast.success('Request created successfully!')
      router.push(`/status/${json.id}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
      setSubmitting(false)
    }
  }

  const isLoading = uploading || submitting

  return (
    <Layout>
      <div className="max-w-lg mx-auto animate-fadeIn">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Create Order Request
          </h1>
          <p className="text-gray-500">Fill in your details and upload your Swiggy cart screenshot</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              className="input-field"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              placeholder="Paste your Swiggy address link"
              rows={3}
              value={form.address}
              onChange={handleChange}
              className="input-field resize-none"
            />
            
            {/* Delivery Instructions - How to get Swiggy address link */}
            <div className="mt-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100">
              <p className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                <span>📍</span> How to get your Swiggy address link:
              </p>
              <ol className="text-sm text-orange-700 space-y-1.5 list-decimal list-inside">
                <li>Open the <strong>Swiggy app</strong> on your phone</li>
                <li>Tap on your <strong>delivery address</strong> at the top</li>
                <li>Select or add your address</li>
                <li>Tap the <strong>Share</strong> icon (or 3 dots → Share)</li>
                <li>Copy the link and paste it here</li>
              </ol>
              <p className="text-xs text-orange-600 mt-2 italic">
              </p>
            </div>
          </div>

          {/* Cart Screenshot Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cart Screenshot <span className="text-red-500">*</span>
            </label>
            
            {!preview ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all duration-200"
              >
                <div className="text-4xl mb-3">📸</div>
                <p className="text-gray-600 font-medium">Click to upload screenshot</p>
                <p className="text-sm text-gray-400 mt-1">PNG, JPG up to 5MB</p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border-2 border-orange-200 bg-orange-50">
                <img src={preview} alt="Cart preview" className="w-full max-h-64 object-contain" />
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-2 right-2 bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                  ✓ Image ready
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              name="notes"
              placeholder="Any special instructions? E.g., 'Extra spicy', 'No onions', etc."
              rows={2}
              value={form.notes}
              onChange={handleChange}
              className="input-field resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full btn-primary flex items-center justify-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {uploading ? 'Uploading image...' : 'Creating request...'}
              </>
            ) : (
              <>Submit Request →</>
            )}
          </button>
        </form>

        {/* Info note */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-sm text-blue-700">
            <strong>What happens next?</strong> We'll review your cart, calculate the total price, and send you payment details. You'll receive updates at each step!
          </p>
        </div>
      </div>
    </Layout>
  )
}