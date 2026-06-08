import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import './ScrollVideoFrame.css';

const FrameImage = memo(({ src, alt, isVisible }) => (
  <div className={`svf-frame ${isVisible ? 'svf-frame-visible' : ''}`}>
    {isVisible && <img src={src} alt={alt} loading="lazy" />}
  </div>
));

const ScrollVideoFrame = ({
  frameCount = 100,
  frameDir = '/images/frames',
  frameExt = 'jpg',
  containerHeight = '500vh',
  overlayContent,
  milestones = [],
  onMilestone,
  preloadBuffer = 10,
  digits = 4,
}) => {
  const containerRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [loadedFrames, setLoadedFrames] = useState(new Set());
  const [visibleIndex, setVisibleIndex] = useState(0);
  const frameRefs = useRef({});

  const padFrame = useCallback((num) => String(num).padStart(digits, '0'), [digits]);

  const getFrameSrc = useCallback((index) => {
    return `${frameDir}/frame_${padFrame(index)}.${frameExt}`;
  }, [frameDir, padFrame, frameExt]);

  const preloadFrame = useCallback((index) => {
    if (loadedFrames.has(index)) return;
    const img = new Image();
    img.src = getFrameSrc(index);
    img.onload = () => {
      setLoadedFrames(prev => new Set(prev).add(index));
    };
    img.onerror = () => {
      setLoadedFrames(prev => new Set(prev).add(index));
    };
  }, [loadedFrames, getFrameSrc]);

  const calcScrollProgress = useCallback(() => {
    if (!containerRef.current) return { progress: 0, index: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const winHeight = window.innerHeight;
    const totalScroll = rect.height - winHeight;
    if (totalScroll <= 0) return { progress: 0, index: 0 };

    const scrolled = -rect.top;
    const p = Math.max(0, Math.min(1, scrolled / totalScroll));
    const idx = Math.round(p * (frameCount - 1));
    return { progress: p, index: idx };
  }, [frameCount]);

  useEffect(() => {
    let rafId = null;
    let lastIndex = -1;

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const { progress: p, index: idx } = calcScrollProgress();
        setProgress(p);
        setCurrentIndex(idx);

        if (idx !== lastIndex) {
          lastIndex = idx;
          for (let i = Math.max(0, idx - preloadBuffer); i <= Math.min(frameCount - 1, idx + preloadBuffer); i++) {
            preloadFrame(i);
          }

          milestones.forEach((m) => {
            if (idx >= m.frame && !m._triggered) {
              m._triggered = true;
              if (onMilestone) onMilestone(m);
              if (m.action) m.action();
            }
          });
        }

        rafId = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [calcScrollProgress, preloadFrame, frameCount, preloadBuffer, milestones, onMilestone]);

  useEffect(() => {
    const preloadRange = [];
    for (let i = 0; i < Math.min(preloadBuffer, frameCount); i++) {
      preloadRange.push(i);
    }
    preloadRange.forEach(preloadFrame);
  }, [frameCount, preloadBuffer, preloadFrame]);

  useEffect(() => {
    const threshold = 0.5;
    const diff = currentIndex - visibleIndex;
    if (Math.abs(diff) > threshold) {
      setVisibleIndex(currentIndex);
    }
  }, [currentIndex, visibleIndex]);

  const frameElements = [];
  for (let i = 0; i < frameCount; i++) {
    const isNear = Math.abs(i - currentIndex) <= preloadBuffer;
    const isLoaded = loadedFrames.has(i);
    const show = isNear && isLoaded;

    frameElements.push(
      <FrameImage
        key={i}
        src={getFrameSrc(i)}
        alt={`Frame ${i + 1}`}
        isVisible={show}
      />
    );
  }

  return (
    <div className="svf-wrapper" ref={containerRef} style={{ height: containerHeight }}>
      <div className="svf-sticky">
        <div className="svf-viewport">
          <div className="svf-frames-stack">
            {frameElements}
          </div>

          <div className="svf-overlay">
            {overlayContent && (
              typeof overlayContent === 'function'
                ? overlayContent({ currentIndex, progress, frameCount })
                : overlayContent
            )}
          </div>

          <div className="svf-progress-bar">
            <div className="svf-progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>

          <div className="svf-frame-counter">
            <span>{String(currentIndex + 1).padStart(digits, '0')}</span>
            <span className="svf-counter-sep">/</span>
            <span>{frameCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrollVideoFrame;
