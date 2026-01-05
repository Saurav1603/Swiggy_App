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
  const [dragOver, setDragOver] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleFile = (f) => {
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

  const handleFileInput = (e) => handleFile(e.target.files[0])

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
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

  // Progress steps
  const steps = [
    { label: 'Your Info', completed: form.name.trim() },
    { label: 'Address', completed: form.address.trim() },
    { label: 'Screenshot', completed: !!file },
  ]
  const completedSteps = steps.filter(s => s.completed).length

  return (
    <Layout>
      <div className="max-w-2xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>📝</span> New Order
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
            Create Order Request
          </h1>
          <p className="text-gray-500 text-lg">Fill in your details and upload your Swiggy cart screenshot</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step.completed 
                    ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {step.completed ? '✓' : i + 1}
                </div>
                <span className={`hidden sm:block text-sm font-medium ${step.completed ? 'text-gray-800' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500 rounded-full"
              style={{ width: `${(completedSteps / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Name Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
              <span className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">👤</span>
              Your Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-orange-400 focus:bg-white outline-none transition-all text-gray-800 placeholder-gray-400"
            />
          </div>

          {/* Address Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
              <span className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">📍</span>
              Delivery Address <span className="text-red-500">*</span>
            </label>
            <textarea
              name="address"
              placeholder="Paste your Swiggy address link or enter full address"
              rows={3}
              value={form.address}
              onChange={handleChange}
              className="w-full px-4 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-orange-400 focus:bg-white outline-none transition-all text-gray-800 placeholder-gray-400 resize-none"
            />
            
            {/* Address Instructions */}
            <div className="mt-4 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100">
              <p className="text-sm font-semibold text-orange-800 mb-3 flex items-center gap-2">
                <span>💡</span> How to get your Swiggy address link:
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  'Open Swiggy app',
                  'Tap on delivery address',
                  'Select your address',
                  'Share → Copy link'
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-orange-700">
                    <span className="w-5 h-5 bg-orange-200 rounded-full flex items-center justify-center text-xs font-bold text-orange-800">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Screenshot Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
              <span className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600">📸</span>
              Cart Screenshot <span className="text-red-500">*</span>
            </label>
            
            {!preview ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
                  dragOver 
                    ? 'border-orange-400 bg-orange-50' 
                    : 'border-gray-200 hover:border-orange-400 hover:bg-orange-50/50'
                }`}
              >
                <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📸</span>
                </div>
                <p className="text-gray-700 font-semibold mb-1">
                  Click to upload or drag & drop
                </p>
                <p className="text-sm text-gray-400">PNG, JPG up to 5MB</p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50 p-4">
                <img 
                  src={preview} 
                  alt="Cart preview" 
                  className="w-full max-h-80 object-contain rounded-xl shadow-lg mx-auto" 
                />
                <button
                  type="button"
                  onClick={removeFile}
                  className="absolute top-6 right-6 bg-red-500 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                >
                  ✕
                </button>
                <div className="absolute bottom-6 left-6 bg-green-500 text-white text-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
                  <span>✓</span> Image ready
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>

          {/* Notes Card */}
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
              <span className="w-6 h-6 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">📝</span>
              Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <textarea
              name="notes"
              placeholder="Any special instructions? E.g., 'Extra spicy', 'No onions', etc."
              rows={2}
              value={form.notes}
              onChange={handleChange}
              className="w-full px-4 py-4 rounded-xl bg-gray-50 border-2 border-transparent focus:border-orange-400 focus:bg-white outline-none transition-all text-gray-800 placeholder-gray-400 resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 ${
              isLoading ? 'opacity-70 cursor-not-allowed hover:scale-100' : ''
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {uploading ? 'Uploading image...' : 'Creating request...'}
              </>
            ) : (
              <>
                Submit Request
                <span className="text-orange-200">→</span>
              </>
            )}
          </button>
        </form>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">What happens next?</h4>
              <p className="text-blue-700 text-sm leading-relaxed">
                We'll review your cart, calculate the total price including delivery, and send you payment details. You'll receive real-time updates at each step!
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
