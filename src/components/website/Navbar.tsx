// src/components/website/Navbar.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Phone, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import Image from 'next/image';

export function Navbar({ agency, onBookNow }: { agency: any; onBookNow: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const phone = agency?.phone?.startsWith('+213') ? agency.phone : '+213';

  const navLinks = [
    { name: 'الوجهات', href: '#', dropdown: true },
    { name: 'من نحن', href: '#about' },
    { name: 'اتصل بنا', href: '#contact' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm h-16 md:h-20 flex items-center px-4 md:px-8">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        {/* Left: logo + agency name */}
        <Link href="/" className="flex items-center space-x-2">
          {agency?.logo_url ? (
            <div className="relative h-10 w-32">
              <Image src={agency.logo_url} alt="logo" fill sizes="128px" className="object-contain" />
            </div>
          ) : (
            <div className="h-10 w-10 bg-slate-200 rounded" />
          )}
          <span className="font-geist font-semibold text-lg text-slate-900">{agency?.company_name}</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex space-x-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              {link.name}
            </Link>
          ))}
          <div className="flex items-center space-x-4">
            <Phone className="h-5 w-5 text-slate-600 hidden md:inline" />
            <span className="text-sm text-slate-600 hidden md:inline">{phone}</span>
            <button
              onClick={onBookNow}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition"
            >
              احجز الآن
            </button>
          </div>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Mobile overlay using Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="bg-white">
          <SheetHeader>
            <SheetTitle className="sr-only">القائمة</SheetTitle>
          </SheetHeader>
          <button
            className="absolute top-4 right-4 p-2"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-6 w-6 text-slate-900" />
          </button>
          <nav className="mt-12 space-y-4 text-right">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="block text-xl font-medium text-slate-800 hover:text-slate-600"
                onClick={() => setMobileOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="mt-6">
              <button
                onClick={() => {
                  setMobileOpen(false);
                  onBookNow();
                }}
                className="w-full bg-slate-900 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition"
              >
                احجز الآن
              </button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
