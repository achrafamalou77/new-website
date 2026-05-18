'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { MessageSquare, Globe, BarChart3, Shield, Zap, CheckCircle2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Zap className="h-6 w-6 fill-current" />
            </div>
            <span className="text-xl font-bold tracking-tight">TravelSaaS<span className="text-blue-600">.dz</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="hover:text-blue-600 transition-colors">Success Stories</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600">Login</Link>
            <Link href="/onboarding">
              <Button className="rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-blue-50/50 rounded-full blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-bold mb-6 tracking-wide uppercase">
              The Future of Travel Agencies in Algeria
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 max-w-4xl mx-auto leading-[1.1]">
              Automate Your Agency. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Sell More Trips.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
              The all-in-one platform for Algerian travel agencies. AI-powered WhatsApp chatbot, stunning websites, and professional management dashboard.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/onboarding">
                <Button size="lg" className="h-14 px-10 rounded-full bg-blue-600 hover:bg-blue-700 text-lg shadow-xl shadow-blue-200 group">
                  Start Your 14-Day Free Trial
                  <ChevronRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 px-10 rounded-full text-lg border-slate-200">
                Book a Demo
              </Button>
            </div>

            <div className="mt-16 relative">
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 h-32 bottom-0" />
              <Image 
                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&auto=format&fit=crop&q=80" 
                alt="Dashboard Preview" 
                width={1200}
                height={800}
                className="rounded-3xl shadow-2xl border border-slate-100 max-w-5xl mx-auto"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything you need to grow</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Stop using pen and paper. Transition to a fully digital workflow designed for the modern era.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MessageSquare className="h-6 w-6" />}
              title="AI WhatsApp Chatbot"
              description="Our AI understands Darja and Arabic. It answers questions, captures leads, and books trips 24/7 on WhatsApp."
            />
            <FeatureCard 
              icon={<Globe className="h-6 w-6" />}
              title="Personalized Website"
              description="Get a premium, mobile-responsive website in seconds. No coding required. Show your trips to the world."
            />
            <FeatureCard 
              icon={<BarChart3 className="h-6 w-6" />}
              title="Unified Dashboard"
              description="Manage all your conversations, bookings, and employees in one place. Powerful analytics to track your growth."
            />
          </div>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-20 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">50+</div>
            <div className="text-sm text-slate-500 font-medium">Active Agencies</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">10k+</div>
            <div className="text-sm text-slate-500 font-medium">Monthly Bookings</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
            <div className="text-sm text-slate-500 font-medium">AI Support</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-blue-600 mb-2">100%</div>
            <div className="text-sm text-slate-500 font-medium">Algerian Built</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -mr-32 -mt-32" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -ml-32 -mb-32" />
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 relative z-10">
              Ready to modernize your agency?
            </h2>
            <p className="text-blue-100/70 text-lg mb-12 max-w-xl mx-auto relative z-10">
              Join the fastest growing travel network in Algeria. Setup takes less than 2 minutes.
            </p>
            
            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/onboarding">
                <Button size="lg" className="h-14 px-10 rounded-full bg-blue-600 hover:bg-blue-700 text-lg shadow-xl shadow-blue-500/20">
                  Create Your Account
                </Button>
              </Link>
              <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                <CheckCircle2 className="h-5 w-5 text-blue-400" />
                No credit card required
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t text-center text-slate-500 text-sm">
        <p>&copy; 2026 TravelSaaS Algeria. All rights reserved.</p>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </div>
  )
}
