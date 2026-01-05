import Link from 'next/link'
import Layout from '../components/Layout'

export default function Home() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-8 md:py-16 animate-fadeIn">
        {/* Background Decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-orange-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100/40 rounded-full blur-3xl"></div>
        </div>

        <div className="text-center max-w-3xl mx-auto">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 px-5 py-2.5 rounded-full text-sm font-medium mb-8 border border-green-200 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            We're online & ready to help
          </div>
          
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
            Upload your Swiggy cart,
            <br />
            <span className="bg-gradient-to-r from-orange-500 via-orange-600 to-red-500 bg-clip-text text-transparent">
              we order for you
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-gray-600 max-w-xl mx-auto mb-10 text-lg md:text-xl leading-relaxed">
            Can't order from Swiggy yourself? Just screenshot your cart, share your address, and we'll handle everything!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/create" 
              className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all"
            >
              <span className="text-2xl group-hover:animate-bounce">🛒</span>
              Create Order Request
              <span className="text-orange-200">→</span>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <span className="text-orange-500">⚡</span> Fast Processing
            </span>
            <span className="flex items-center gap-2">
              <span className="text-orange-500">🔒</span> Secure Payments
            </span>
            <span className="flex items-center gap-2">
              <span className="text-orange-500">💬</span> Human Support
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 md:py-20">
        <div className="text-center mb-12">
          <span className="inline-block text-orange-500 text-sm font-semibold tracking-wider uppercase mb-3">Simple Process</span>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
            How it works
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {[
            { 
              icon: '📸', 
              title: 'Screenshot Cart', 
              desc: 'Take a screenshot of your Swiggy cart with all the items you want to order',
              step: '01'
            },
            { 
              icon: '💵', 
              title: 'Pay via UPI', 
              desc: 'We calculate the total including delivery charges. You pay securely via UPI',
              step: '02'
            },
            { 
              icon: '🛵', 
              title: 'We Deliver', 
              desc: 'We place the order on Swiggy and share the live tracking link with you',
              step: '03'
            },
          ].map((step, i) => (
            <div 
              key={i}
              className="group relative bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 hover:shadow-orange-500/10 hover:border-orange-200 transition-all duration-300 animate-slideUp"
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {/* Step Number */}
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-2xl flex items-center justify-center text-white font-bold shadow-lg">
                {step.step}
              </div>
              
              {/* Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <span className="text-5xl">{step.icon}</span>
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why use us */}
      <section className="py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Benefits Card */}
          <div className="bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-gray-200/50 border border-gray-100">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span>✨</span> Why Choose Us
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Why use Swiggy Concierge?</h2>
            
            <ul className="space-y-5">
              {[
                { icon: '🚫', text: 'No Swiggy account needed', highlight: 'No Account' },
                { icon: '📱', text: 'No app installation required', highlight: 'No App' },
                { icon: '💳', text: 'Pay only via UPI — no cards needed', highlight: 'UPI Only' },
                { icon: '👤', text: 'Real human support for any issues', highlight: 'Human Help' },
                { icon: '💯', text: 'Transparent pricing — no hidden fees', highlight: 'No Hidden Fees' },
              ].map((item, i) => (
                <li 
                  key={i} 
                  className="flex items-center gap-4 p-4 rounded-2xl hover:bg-orange-50/50 transition-colors group"
                >
                  <span className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-50 to-emerald-100 text-2xl rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    {item.icon}
                  </span>
                  <div className="flex-1">
                    <span className="text-gray-700 font-medium">{item.text}</span>
                  </div>
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">✓</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Special Offers Card */}
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 rounded-3xl p-8 md:p-10 shadow-xl shadow-orange-500/30 text-white">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur px-4 py-2 rounded-full text-sm font-medium mb-6">
              <span>🎁</span> Special Offers
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-8">Exclusive Benefits</h2>
            
            <ul className="space-y-6">
              {[
                { icon: '💸', title: 'First Order Discount', desc: 'Get up to 10% off on your first order!' },
                { icon: '👫', title: 'Referral Rewards', desc: 'Invite friends and earn ₹50 wallet credit each' },
                { icon: '⚡', title: 'Priority Support', desc: 'Get instant help for any order issues' },
                { icon: '🎉', title: 'Festival Offers', desc: 'Enjoy surprise deals throughout the year!' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-2xl">
                    {item.icon}
                  </span>
                  <div>
                    <h4 className="font-bold text-lg">{item.title}</h4>
                    <p className="text-orange-100">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            
            {/* CTA */}
            <div className="mt-10">
              <Link 
                href="/create" 
                className="inline-flex items-center gap-2 bg-white text-orange-600 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors shadow-lg"
              >
                Start Ordering Now →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 md:py-20">
        <div className="text-center mb-12">
          <span className="inline-block text-orange-500 text-sm font-semibold tracking-wider uppercase mb-3">Got Questions?</span>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {[
            { q: 'How do I pay?', a: 'You pay via UPI. We\'ll send you a QR code and UPI ID after calculating the total price.' },
            { q: 'How long does it take?', a: 'Once payment is verified, we place your order within minutes. Delivery time depends on the restaurant.' },
            { q: 'Can I track my order?', a: 'Yes! We share the Swiggy tracking link with you once the order is placed.' },
            { q: 'What if there\'s an issue?', a: 'We provide human support for any issues. Just check your order status page for updates.' },
          ].map((faq, i) => (
            <details 
              key={i} 
              className="group bg-white rounded-2xl shadow-lg shadow-gray-100 border border-gray-100 overflow-hidden"
            >
              <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                <span className="font-semibold text-gray-900">{faq.q}</span>
                <span className="text-orange-500 text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="px-6 pb-6 text-gray-600">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 md:py-20">
        <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-40 h-40 bg-orange-500 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-0 w-60 h-60 bg-orange-400 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to order?
            </h2>
            <p className="text-gray-400 mb-8 max-w-lg mx-auto">
              Create your order request now and we'll take care of the rest. No app needed!
            </p>
            <Link 
              href="/create" 
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all"
            >
              🛒 Create Order Request
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  )
}
