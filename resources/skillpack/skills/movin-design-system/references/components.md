# MOVIN Component Library

> React + TypeScript + Tailwind CSS 기반 컴포넌트

---

## Button Component

```tsx
// components/ui/Button.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-medium transition-all duration-300',
          'focus:outline-none focus:ring-2 focus:ring-accent-neon/50 focus:ring-offset-2 focus:ring-offset-bg-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',

          // Variants
          {
            // Primary - Neon
            'bg-accent-neon text-black hover:bg-accent-neon/90 active:scale-[0.98]':
              variant === 'primary',
            // Secondary - Filled dark
            'bg-bg-tertiary text-white hover:bg-bg-elevated':
              variant === 'secondary',
            // Ghost - Text only
            'bg-transparent text-white/70 hover:text-white hover:bg-white/5':
              variant === 'ghost',
            // Outline - Border
            'bg-transparent border border-white/20 text-white hover:bg-white/10 hover:border-white/30':
              variant === 'outline',
          },

          // Sizes
          {
            'text-xs px-3 py-1.5 rounded-lg': size === 'sm',
            'text-sm px-5 py-2.5 rounded-xl': size === 'md',
            'text-base px-7 py-3.5 rounded-2xl': size === 'lg',
          },

          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Usage

```tsx
<Button variant="primary" size="lg">Order Now</Button>
<Button variant="outline">Learn More</Button>
<Button variant="ghost">Cancel</Button>
```

---

## Card Component

```tsx
// components/ui/Card.tsx
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  hover?: boolean;
}

export function Card({
  className,
  variant = 'default',
  hover = true,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-300',

        // Variants
        {
          'bg-bg-secondary border border-white/10':
            variant === 'default',
          'bg-bg-elevated border border-white/10 shadow-lg':
            variant === 'elevated',
          'bg-white/5 backdrop-blur-md border border-white/10':
            variant === 'glass',
        },

        // Hover effect
        hover && 'hover:border-white/20 hover:shadow-xl',

        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pb-0', className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 pt-0 flex items-center gap-4', className)} {...props} />;
}
```

### Usage

```tsx
<Card variant="glass" hover>
  <CardHeader>
    <h3 className="text-xl font-semibold">Feature</h3>
  </CardHeader>
  <CardContent>
    <p className="text-white/60">Description here...</p>
  </CardContent>
  <CardFooter>
    <Button variant="primary" size="sm">Learn More</Button>
  </CardFooter>
</Card>
```

---

## Navigation Component

```tsx
// components/layout/Navigation.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const navLinks = [
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/docs', label: 'Docs' },
];

export function Navigation() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-black/80 backdrop-blur-md border-b border-white/10'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold">
            <span className="text-white">BRAND</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/70 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex">
              Sign In
            </Button>
            <Button variant="primary" size="sm">
              Get Started
            </Button>
          </div>
        </div>
      </nav>
    </header>
  );
}
```

---

## Hero Section Component

```tsx
// components/sections/Hero.tsx
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-bg-primary">
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-neon/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent-neon/10 rounded-full blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6"
        >
          MOTION IS YOUR
          <br />
          <span className="bg-gradient-to-r from-accent-neon to-accent-green bg-clip-text text-transparent">
            NEXT AI
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto"
        >
          Create professional-grade human motion,
          faster and simpler than ever
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button variant="primary" size="lg">
            Order Now
          </Button>
          <Button variant="outline" size="lg">
            Learn More
          </Button>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 bg-white rounded-full"
          />
        </div>
      </motion.div>
    </section>
  );
}
```

---

## Feature Card Component

```tsx
// components/ui/FeatureCard.tsx
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  index?: number;
}

export function FeatureCard({ icon: Icon, title, description, index = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={cn(
        'group relative p-6 rounded-2xl',
        'bg-bg-secondary border border-white/10',
        'hover:border-accent-neon/30 hover:bg-bg-tertiary',
        'transition-all duration-300'
      )}
    >
      {/* Icon */}
      <div className={cn(
        'w-12 h-12 rounded-xl mb-4',
        'bg-accent-neon/10 text-accent-neon',
        'flex items-center justify-center',
        'group-hover:bg-accent-neon/20 transition-colors'
      )}>
        <Icon className="w-6 h-6" />
      </div>

      {/* Content */}
      <h3 className="text-lg font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-sm text-white/60 leading-relaxed">
        {description}
      </p>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-accent-neon/5 to-transparent" />
      </div>
    </motion.div>
  );
}
```

---

## Input Component

```tsx
// components/ui/Input.tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-white/70">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full px-4 py-3 rounded-xl',
            'bg-bg-secondary border border-white/10',
            'text-white placeholder:text-white/30',
            'focus:outline-none focus:border-accent-neon/50 focus:ring-1 focus:ring-accent-neon/50',
            'transition-all duration-200',
            error && 'border-error focus:border-error focus:ring-error/50',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-sm text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

---

## Footer Component

```tsx
// components/layout/Footer.tsx
import Link from 'next/link';

const footerLinks = {
  product: [
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Downloads', href: '/downloads' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Blog', href: '/blog' },
    { label: 'Careers', href: '/careers' },
  ],
  resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Support', href: '/support' },
    { label: 'FAQ', href: '/faq' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-bg-secondary border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-2xl font-bold text-white">
              BRAND
            </Link>
            <p className="mt-4 text-sm text-white/60">
              Create professional-grade solutions with next-gen AI technology.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} Brand Inc. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-sm text-white/40 hover:text-white/60">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-white/40 hover:text-white/60">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
```

---

## Utility Function

```ts
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Required Dependencies

```bash
npm install clsx tailwind-merge framer-motion lucide-react
```
