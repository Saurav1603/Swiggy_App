import { useEffect, useState, useRef } from 'react'

export default function AdminOrderPopup({ order, socket, onDecision }) {
  const [timeLeft, setTimeLeft] = useState(45)
  const timerRef = useRef()

  useEffect(() => {
    timerRef.current = setInterval(() => setTimeLeft(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    if (timeLeft === 0) {
      // auto-decline
      onDecision('timeout')
    }
  }, [timeLeft])

  const accept = async () => {
    onDecision('accept', order.id)
  }
  const decline = async () => {
    onDecision('decline', order.id)
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white shadow-xl rounded-xl p-4 z-50">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">New Order</div>
          <div className="text-xs text-gray-500">{order.request?.name || 'Customer'}</div>
        </div>
        <div className="text-sm font-mono text-gray-700">{timeLeft}s</div>
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={accept} className="flex-1 bg-green-600 text-white py-2 rounded">Accept</button>
        <button onClick={decline} className="flex-1 bg-gray-200 py-2 rounded">Decline</button>
      </div>
    </div>
  )
}
