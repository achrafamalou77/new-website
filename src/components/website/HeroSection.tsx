// src/components/website/HeroSection.tsx
'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, Phone, Play } from 'lucide-react';

interface HeroSectionProps {
  agency: any;
  onExplore?: () => void;
}

export function HeroSection({ agency, onExplore }: HeroSectionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = agency.website_config || {};
  
  const heroImage = config.content?.hero_bg_url ||
    'https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1920&q=80';
  
  // Optional background video (fallback to public high quality MP4)
  const heroVideo = config.content?.hero_video_url || 
    'https://assets.mixkit.co/videos/preview/mixkit-dramatic-drone-shot-of-cappadocia-turkey-41484-large.mp4';
  
  const badge = config.content?.badge || '✨ Summer 2026 Deals';
  const title = config.content?.hero_title || `Discover Turkey with ${agency.company_name}`;
  const subtitle = config.content?.hero_subtitle || 'Handpicked destinations, unbeatable prices, unforgettable memories — crafted for Algerian travelers.';

  // High performance Canvas Particle Emitter
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Track resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle class
    class Particle {
      x: number = Math.random() * width;
      y: number = Math.random() * height + height;
      size: number = Math.random() * 2.5 + 0.5;
      speedY: number = -(Math.random() * 0.7 + 0.3);
      alpha: number = Math.random() * 0.5 + 0.1;
      fadeSpeed: number = Math.random() * 0.005 + 0.002;

      update() {
        this.y += this.speedY;
        if (this.y < -10) {
          this.y = height + 10;
          this.x = Math.random() * width;
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.globalAlpha = this.alpha;
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fillStyle = 'rgba(255, 255, 255, 0.8)';
        c.shadowBlur = 8;
        c.shadowColor = 'rgba(255, 255, 255, 0.5)';
        c.fill();
        c.restore();
      }
    }

    const particles: Particle[] = Array.from({ length: 45 }, () => new Particle());

    // Loop
    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      particles.forEach((p) => {
        p.update();
        p.draw(ctx);
      });
      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  const container: any = {
    hidden: { opacity: 0, y: 40 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: [0.4, 0, 0.2, 1] },
    }),
  };

  return (
    <section className="relative min-h-[85vh] max-h-[900px] overflow-hidden bg-slate-950">
      
      {/* Video Background (Autoplay, Loop, Muted, Lazy / cover) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
        poster={heroImage}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* Subtle particle canvas drawing */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 pointer-events-none z-10 mix-blend-screen"
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-transparent z-0" />
      
      {/* Visual glowing border bottom */}
      <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none z-20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center z-25 py-24">
        <div className="text-left max-w-2xl space-y-6">
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={container}
            className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-2 shadow-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            {badge}
          </motion.div>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={container}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.08] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-100"
          >
            {title}
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={container}
            className="text-base sm:text-lg md:text-xl text-white/80 max-w-xl font-medium leading-relaxed"
          >
            {subtitle}
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={container}
            className="flex flex-wrap gap-4 pt-4"
          >
            <button
              onClick={onExplore}
              className="bg-white text-slate-900 px-8 py-4 rounded-full font-black text-sm hover:bg-slate-100 flex items-center gap-2 hover:scale-[1.02] shadow-lg active:scale-95 transition"
            >
              استكشاف الرحلات
              <ArrowRight size={18} />
            </button>
            
            <a
              href={`https://wa.me/${agency.phone?.replace('+', '') || '213'}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#25D366] text-white px-8 py-4 rounded-full font-black text-sm hover:bg-[#20ba59] flex items-center gap-2 hover:scale-[1.02] shadow-lg active:scale-95 transition"
            >
              <Phone size={18} />
              WhatsApp
            </a>
          </motion.div>

          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={container}
            className="flex gap-6 text-[10px] sm:text-xs text-white/60 font-semibold tracking-wider uppercase pt-4"
          >
            <span>⭐ 4.9/5 Rating</span>
            <span>✓ Verified Agency</span>
            <span>🛡️ Secure Booking</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
