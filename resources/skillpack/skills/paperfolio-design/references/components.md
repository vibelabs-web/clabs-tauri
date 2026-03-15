# Paperfolio Components Reference

## Full Page Template

```tsx
// pages/index.tsx or app/page.tsx
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export default function HomePage() {
  return (
    <main className={`${inter.variable} ${playfair.variable} bg-white min-h-screen`}>
      <PaperfolioNav />
      <PaperfolioHero />
      <ClientLogoBanner />
      <PortfolioSection />
      <AboutSection />
      <ContactSection />
      <Footer />
    </main>
  );
}
```

---

## Navigation Component

```tsx
'use client';

import { useState } from 'react';
import { Menu, X, Mail } from 'lucide-react';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Contact', href: '/contact' },
];

export function PaperfolioNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8 bg-black text-white px-8 py-4 rounded-full shadow-lg">
        {/* Logo */}
        <a href="/" className="w-8 h-8 border-2 border-white rounded-full flex items-center justify-center">
          <span className="sr-only">Logo</span>
        </a>

        {/* Links */}
        <div className="flex items-center gap-6 text-sm font-medium">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:opacity-70 transition-opacity duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <button className="bg-white text-black p-2 rounded-lg hover:bg-gray-100 transition">
          <Mail className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-black text-white p-4 rounded-full"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {isOpen && (
          <div className="absolute top-full mt-4 left-1/2 -translate-x-1/2 bg-black text-white rounded-2xl p-6 min-w-[200px]">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block py-2 text-center hover:opacity-70 transition"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
```

---

## Hero Section

```tsx
import { Mail, FolderOpen } from 'lucide-react';

interface HighlightProps {
  children: React.ReactNode;
  color?: 'coral' | 'blue' | 'yellow';
}

function Highlight({ children, color = 'coral' }: HighlightProps) {
  const colors = {
    coral: 'bg-[#FF6B6B]',
    blue: 'bg-[#3B82F6]',
    yellow: 'bg-[#FBBF24]',
  };

  return (
    <span className={`${colors[color]} px-2 py-1 text-white inline-block`}>
      {children}
    </span>
  );
}

export function PaperfolioHero() {
  return (
    <section className="min-h-screen flex items-center px-6 lg:px-16 pt-32">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Text Content */}
        <div className="space-y-8">
          <h1 className="font-playfair text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
            I'm <Highlight color="coral">John Carter</Highlight>,
            <br />
            a Web Designer
            <br />
            from <Highlight color="blue">New York</Highlight>
          </h1>

          <p className="text-gray-500 text-lg max-w-lg leading-relaxed">
            Lacus, adipiscing lectus convallis purus aliquet cursus magna
            montes augue donec cras turpis ultrices nulla sed doler.
          </p>

          <div className="flex flex-wrap gap-4">
            <button className="bg-black text-white px-8 py-4 rounded-lg flex items-center gap-3 font-medium hover:bg-gray-900 transition">
              <Mail className="w-5 h-5" />
              Get in touch
            </button>
            <button className="bg-white text-black border-2 border-black px-8 py-4 rounded-lg flex items-center gap-3 font-medium hover:bg-gray-50 transition">
              <FolderOpen className="w-5 h-5" />
              View portfolio
            </button>
          </div>
        </div>

        {/* Illustration */}
        <div className="relative">
          <div className="bg-[#FBBF24] rounded-3xl overflow-hidden aspect-square flex items-end justify-center">
            {/* Replace with your illustration */}
            <div className="w-3/4 h-3/4 bg-[#FF6B6B] rounded-t-full relative">
              {/* Polka dots pattern */}
              <div className="absolute inset-0 opacity-50">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 bg-[#FBBF24] rounded-full"
                    style={{
                      top: `${Math.random() * 80 + 10}%`,
                      left: `${Math.random() * 80 + 10}%`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## Client Logo Banner

```tsx
export function ClientLogoBanner() {
  const clients = [
    { name: 'business', icon: '◆' },
    { name: 'company', icon: '○' },
    { name: 'startup', icon: '↗' },
    { name: 'venture', icon: '◐' },
    { name: 'agency', icon: '◑' },
    { name: 'application', icon: '●' },
  ];

  // Duplicate for seamless loop
  const allClients = [...clients, ...clients];

  return (
    <div className="bg-black -rotate-2 py-6 overflow-hidden my-16">
      <div className="flex animate-marquee whitespace-nowrap">
        {allClients.map((client, i) => (
          <div
            key={i}
            className="flex items-center gap-3 text-white text-xl font-medium mx-8"
          >
            <span className="text-2xl">{client.icon}</span>
            <span>{client.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Portfolio Grid

```tsx
interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image: string;
  link: string;
}

export function PortfolioSection({ items }: { items: PortfolioItem[] }) {
  return (
    <section className="py-24 px-6 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-12">
          Selected <Highlight color="coral">Works</Highlight>
        </h2>

        <div className="grid md:grid-cols-2 gap-8">
          {items.map((item) => (
            <a
              key={item.id}
              href={item.link}
              className="group block"
            >
              <div className="overflow-hidden rounded-2xl bg-gray-100 aspect-[4/3] mb-4">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <span className="text-sm text-gray-500 uppercase tracking-wider">
                {item.category}
              </span>
              <h3 className="font-playfair text-2xl font-bold mt-1 group-hover:opacity-70 transition">
                {item.title}
              </h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## Button Variants

```tsx
import { LucideIcon } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export function PaperfolioButton({
  children,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  onClick,
}: ButtonProps) {
  const baseStyles = 'flex items-center gap-3 font-medium rounded-lg transition';

  const variants = {
    primary: 'bg-black text-white hover:bg-gray-900',
    secondary: 'bg-white text-black border-2 border-black hover:bg-gray-50',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]}`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
}
```

---

## CSS Animation for Marquee

```css
/* globals.css */
@keyframes marquee {
  0% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(-50%);
  }
}

.animate-marquee {
  animation: marquee 20s linear infinite;
}

/* Pause on hover */
.animate-marquee:hover {
  animation-play-state: paused;
}
```

---

## Font Setup (Next.js)

```tsx
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: var(--font-inter), system-ui, sans-serif;
}

.font-playfair {
  font-family: var(--font-playfair), Georgia, serif;
}
```
