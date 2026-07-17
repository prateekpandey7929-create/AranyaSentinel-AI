import React, { useState, useEffect } from 'react';

export const LoadingSkeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-slate-800/50 rounded-xl ${className}`}></div>
);

export const AnimatedCounter = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame;
    const target = parseInt(value, 10);
    
    if (isNaN(target)) {
      setCount(value);
      return;
    }

    const easeOutQuart = (t) => 1 - (--t) * t * t * t;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = currentTime - startTime;
      const percentage = Math.min(progress / duration, 1);
      const easedPercentage = easeOutQuart(percentage);
      
      setCount(Math.floor(target * easedPercentage));

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(target);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span>{count}</span>;
};

export const SectionHeader = ({ title, description }) => (
  <div className="text-center mb-12 space-y-4">
    <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">{title}</h2>
    {description && (
      <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
        {description}
      </p>
    )}
  </div>
);
