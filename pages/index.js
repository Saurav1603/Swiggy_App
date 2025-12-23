import Link from 'next/link'
import Layout from '../components/Layout'

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="text-center py-8 md:py-16 animate-fadeIn">
        <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <span className="animate-pulse-slow">🟢</span>
          We're online & ready to help
        </div>
        
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Upload your Swiggy cart,
          <br />
          <span className="bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
            we order for you
          </span>
        </h1>
        
        <p className="text-gray-600 max-w-lg mx-auto mb-8 text-base md:text-lg">
          Can't order from Swiggy yourself? Just screenshot your cart, share delivery address, and we'll handle everything!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/create" className="btn-primary text-center">
            🛒 Create Order Request
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="py-8 md:py-12">
        <h2 className="text-center text-xl md:text-2xl font-bold text-gray-800 mb-8">
          How it works
        </h2>
        
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {[
            { icon: '📸', title: 'Screenshot Cart', desc: 'Take a screenshot of your Swiggy cart with items you want' },
            { icon: '💵', title: 'Pay via UPI', desc: 'We calculate total including delivery, you pay via UPI' },
            { icon: '🛵', title: 'We Deliver', desc: 'We place the order and share tracking link with you' },
          ].map((step, i) => (
            <div 
              key={i}
              className="card p-6 text-center animate-slideUp"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="text-4xl md:text-5xl block mb-4">{step.icon}</span>
              <h3 className="font-bold text-gray-800 mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why use us */}
      <section className="py-8 md:py-12">
        <div className="card p-6 md:p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Why use Swiggy Concierge?</h2>
          <ul className="space-y-3">
            {[
              'No Swiggy account needed',
              'No app installation required',
              'Pay only via UPI — no cards needed',
              'Human support for any issues',
              'Transparent pricing — no hidden fees',
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-600">
                <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Special Offers & Benefits */}
        <div className="card p-6 md:p-8 bg-orange-50 border-orange-200 border-2 animate-fadeIn">
          <h2 className="text-xl font-bold text-orange-700 mb-4 flex items-center gap-2">
            <span>🎁</span> Special Offers & Benefits
          </h2>
          <ul className="space-y-3 text-orange-900">
            <li className="flex items-center gap-3">
              <span className="text-2xl">💸</span>
              <span><b>Exclusive Discounts:</b> Get up to <b>10% off</b> on your first order!</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">👫</span>
              <span><b>Referral Rewards:</b> Invite friends and earn <b>₹50</b> wallet credit for each successful referral.</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <span><b>Fast Support:</b> Get priority help for any order issues, anytime.</span>
            </li>
            <li className="flex items-center gap-3">
              <span className="text-2xl">🎉</span>
              <span><b>Special Offers:</b> Enjoy surprise deals and festival offers throughout the year!</span>
            </li>
          </ul>
        </div>
      </section>
    </Layout>
  )
}
