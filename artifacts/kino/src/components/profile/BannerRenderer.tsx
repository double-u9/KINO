import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface BannerRendererProps {
  bannerUrl?: string | null;
  bannerType?: string;
  themeColor: string;
  className?: string;
  overlayIntensity?: number;
}

export function BannerRenderer({
  bannerUrl,
  bannerType = 'static',
  themeColor,
  className = '',
  overlayIntensity = 0.5,
}: BannerRendererProps) {
  const [loaded, setLoaded] = useState(false);
  const [inView, setInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy loading with IntersectionObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isVideo = bannerType === 'video';
  const hasMedia = !!bannerUrl && inView;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{
        background: bannerUrl
          ? 'rgba(0,0,0,1)'
          : `linear-gradient(135deg, ${themeColor}18 0%, rgba(8,8,8,1) 40%, ${themeColor}0D 100%)`,
      }}
    >
      {/* Ambient gradient fallback (always visible) */}
      {!bannerUrl && (
        <>
          <motion.div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 25% 70%, ${themeColor}28, transparent 55%), radial-gradient(ellipse at 75% 30%, ${themeColor}1A, transparent 55%)`,
            }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          {/* Subtle particles / noise */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
            }}
          />
        </>
      )}

      {/* Media content */}
      {hasMedia && (
        isVideo ? (
          <motion.video
            src={bannerUrl!}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            onLoadedData={() => setLoaded(true)}
          />
        ) : (
          <motion.img
            src={bannerUrl!}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: loaded ? 1 : 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            onLoad={() => setLoaded(true)}
          />
        )
      )}

      {/* Cinematic dark overlays */}
      {bannerUrl && (
        <>
          {/* Bottom gradient for text readability */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, transparent 20%, rgba(0,0,0,${overlayIntensity * 0.3}) 60%, rgba(0,0,0,${overlayIntensity}) 100%)`,
            }}
          />
          {/* Vignette effect */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.3) 100%)',
            }}
          />
          {/* Subtle theme color tint at bottom */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(180deg, transparent 70%, ${themeColor}15 100%)`,
            }}
          />
        </>
      )}
    </div>
  );
}
