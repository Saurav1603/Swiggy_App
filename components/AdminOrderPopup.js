import { useEffect, useState, useRef } from 'react'

export default function AdminOrderPopup({ order, socket, onDecision }) {
  const [timeLeft, setTimeLeft] = useState(45)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isDeclining, setIsDeclining] = useState(false)
  const [isGone, setIsGone] = useState(false)
  const timerRef = useRef()
  const audioRef = useRef()

  // Play notification sound on mount
  useEffect(() => {
    try {
      audioRef.current = new Audio('/notification.mp3')
      audioRef.current.play().catch(() => {})
    } catch (e) {}

    timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => {
      clearInterval(timerRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  useEffect(() => {
    if (timeLeft === 0) {
      // auto-decline on timeout
      handleDecision('timeout')
    }
  }, [timeLeft])

  // Listen for order being accepted by another admin
  useEffect(() => {
    if (!socket) return
    
    const handleAccepted = ({ orderId }) => {
      if (orderId === order.orderId) {
        setIsGone(true)
        setTimeout(() => onDecision('taken', order.orderId), 500)
      }
    }
    
    socket.on('ORDER_ACCEPTED', handleAccepted)
    return () => socket.off('ORDER_ACCEPTED', handleAccepted)
  }, [socket, order.orderId])

  const handleDecision = async (action) => {
    if (action === 'accept') {
      setIsAccepting(true)
    } else {
      setIsDeclining(true)
    }
    await onDecision(action, order.orderId)
  }

  if (isGone) {
    return (
      <div className="fixed bottom-6 right-6 w-96 bg-yellow-50 border-2 border-yellow-400 shadow-2xl rounded-2xl p-5 z-50 animate-pulse">
        <div className="text-center">
          <span className="text-4xl">⚡</span>
          <p className="font-semibold text-yellow-700 mt-2">Order taken by another admin!</p>
        </div>
      </div>
    )
  }

  const progressPercent = (timeLeft / 45) * 100
  const isUrgent = timeLeft <= 10

  return (
    <div className={`fixed bottom-6 right-6 w-96 bg-white shadow-2xl rounded-2xl overflow-hidden z-50 border-2 
      ${isUrgent ? 'border-red-400 animate-pulse' : 'border-orange-400'}`}>
      
      {/* Progress Bar */}
      <div className="h-1.5 bg-gray-200">
        <div 
          className={`h-full transition-all duration-1000 ${isUrgent ? 'bg-red-500' : 'bg-orange-500'}`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Header */}
      <div className={`px-5 py-3 ${isUrgent ? 'bg-red-50' : 'bg-orange-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-bounce">🛵</span>
            <div>
              <div className="font-bold text-lg text-gray-900">New Order!</div>
              <div className="text-xs text-gray-500">First to accept gets it</div>
            </div>
          </div>
          <div className={`text-2xl font-mono font-bold ${isUrgent ? 'text-red-600' : 'text-orange-600'}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="p-5">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">👤</span>
            <span className="font-semibold text-gray-900">{order.request?.name || 'Customer'}</span>
          </div>
          
          {order.request?.phone && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
              <span>📱</span>
              <span>{order.request.phone}</span>
            </div>
          )}
          
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <span>📍</span>
            <span className="line-clamp-2">{order.request?.address || 'Address not provided'}</span>
          </div>

          {order.request?.notes && (
            <div className="mt-2 p-2 bg-gray-50 rounded-lg text-sm text-gray-600">
              <span className="font-medium">Notes:</span> {order.request.notes}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button 
            onClick={() => handleDecision('accept')}
            disabled={isAccepting || isDeclining}
            className={`flex-1 py-3 rounded-xl font-bold text-white transition-all transform hover:scale-105
              ${isAccepting ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}
              ${isDeclining ? 'opacity-50' : ''}`}
          >
            {isAccepting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span> Accepting...
              </span>
            ) : (
              <span>✅ Accept</span>
            )}
          </button>
          
          <button 
            onClick={() => handleDecision('decline')}
            disabled={isAccepting || isDeclining}
            className={`flex-1 py-3 rounded-xl font-bold transition-all
              ${isDeclining ? 'bg-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
              ${isAccepting ? 'opacity-50' : ''}`}
          >
            {isDeclining ? 'Declining...' : '❌ Decline'}
          </button>
        </div>
      </div>

      {/* Urgent Warning */}
      {isUrgent && (
        <div className="px-5 pb-4">
          <div className="bg-red-100 border border-red-300 text-red-700 text-center py-2 rounded-lg text-sm font-medium animate-pulse">
            ⚠️ Hurry! Order expires soon!
          </div>
        </div>
      )}
    </div>
  )
}
