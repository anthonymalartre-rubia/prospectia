'use client';

// ─────────────────────────────────────────────────────────────────────
// MotionInView — wrapper qui ajoute des classes d'animation Tailwind
// quand l'élément entre dans le viewport (scroll-triggered).
// ─────────────────────────────────────────────────────────────────────
//
// Utilise IntersectionObserver natif (0 dep ajoutée) + les classes
// `animate-in` de tailwindcss-animate (plugin déjà installé).
//
// Pattern : par défaut invisible (opacity-0 translate-y-4), au moment
// où l'élément touche le viewport (threshold 0.15), bascule en visible
// avec animation fade-in + slide-up.
//
// Usage :
//   <MotionInView>
//     <h2>Hello</h2>
//   </MotionInView>
//
// Avec delay/stagger pour grilles :
//   {items.map((item, i) => (
//     <MotionInView key={item.id} delay={i * 100}>
//       <Card {...item} />
//     </MotionInView>
//   ))}
//
// Performance : observer créé une seule fois, désobserve dès l'élément
// visible (animation one-shot, ne se rejoue pas). Pas d'impact scroll.
// ─────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';

export default function MotionInView({
  children,
  delay = 0,
  duration = 700,
  className = '',
  as: Tag = 'div',
  direction = 'up', // 'up' | 'down' | 'left' | 'right' | 'none'
  amount = 4,       // 1-8 (Tailwind animate-in scale)
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    if (typeof window === 'undefined') return;

    // Respect prefers-reduced-motion
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const directionClass = {
    up:    `slide-in-from-bottom-${amount}`,
    down:  `slide-in-from-top-${amount}`,
    left:  `slide-in-from-right-${amount}`,
    right: `slide-in-from-left-${amount}`,
    none:  '',
  }[direction];

  const animClasses = visible
    ? `animate-in fade-in ${directionClass}`
    : 'opacity-0';

  return (
    <Tag
      ref={ref}
      className={`${animClasses} ${className}`}
      style={{ animationDuration: `${duration}ms`, animationDelay: `${delay}ms`, animationFillMode: 'both' }}
    >
      {children}
    </Tag>
  );
}
