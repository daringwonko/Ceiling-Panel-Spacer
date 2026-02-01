/**
 * Presentation Mode Component
 * 
 * Fullscreen presentation mode with slideshow functionality.
 * Supports auto-advance, keyboard navigation, and multiple view configurations.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import styles from './PresentationMode.module.css';

export interface PresentationSlide {
  id: string;
  title: string;
  content: React.ReactNode;
  thumbnail?: string;
  duration?: number; // Auto-advance duration in seconds
  annotations?: string[];
}

export interface PresentationConfig {
  autoAdvance: boolean;
  autoAdvanceDelay: number;
  showTimer: boolean;
  showSlideNumber: boolean;
  loopSlideshow: boolean;
  transitionEffect: 'none' | 'fade' | 'slide' | 'zoom';
  transitionDuration: number;
}

export interface PresentationModeProps {
  // Slides data
  slides: PresentationSlide[];
  initialSlideIndex?: number;
  
  // Canvas/container reference for capture
  containerRef: React.RefObject<HTMLElement>;
  
  // Callbacks
  onSlideChange?: (slide: PresentationSlide, index: number) => void;
  onPresentationEnd?: () => void;
  onExit?: () => void;
  
  // Configuration
  config?: Partial<PresentationConfig>;
  
  // Options
  enableFullscreen?: boolean;
  enableKeyboardControls?: boolean;
  enableTimer?: boolean;
  showControls?: boolean;
}

const DEFAULT_CONFIG: PresentationConfig = {
  autoAdvance: false,
  autoAdvanceDelay: 5,
  showTimer: true,
  showSlideNumber: true,
  loopSlideshow: false,
  transitionEffect: 'fade',
  transitionDuration: 300
};

export function PresentationMode({
  slides,
  initialSlideIndex = 0,
  containerRef,
  onSlideChange,
  onPresentationEnd,
  onExit,
  config = {},
  enableFullscreen = true,
  enableKeyboardControls = true,
  enableTimer = true,
  showControls = true
}: PresentationModeProps) {
  const [isActive, setIsActive] = useState(false);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(initialSlideIndex);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const presentationRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const autoAdvanceRef = useRef<number | null>(null);
  
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const currentSlide = slides[currentSlideIndex];
  
  // Fullscreen handling
  const enterFullscreen = useCallback(async () => {
    if (!presentationRef.current) return;
    
    try {
      if (presentationRef.current.requestFullscreen) {
        await presentationRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, []);
  
  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);
  
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);
  
  // Slide navigation
  const goToSlide = useCallback((index: number) => {
    if (index < 0 || index >= slides.length) return;
    
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentSlideIndex(index);
      onSlideChange?.(slides[index], index);
      setTimer(0);
      setIsTransitioning(false);
    }, mergedConfig.transitionDuration);
  }, [slides, onSlideChange, mergedConfig.transitionDuration]);
  
  const nextSlide = useCallback(() => {
    const nextIndex = currentSlideIndex + 1;
    if (nextIndex >= slides.length) {
      if (mergedConfig.loopSlideshow) {
        goToSlide(0);
        onPresentationEnd?.();
      } else {
        onPresentationEnd?.();
      }
    } else {
      goToSlide(nextIndex);
    }
  }, [currentSlideIndex, slides.length, mergedConfig.loopSlideshow, goToSlide, onPresentationEnd]);
  
  const prevSlide = useCallback(() => {
    const prevIndex = currentSlideIndex - 1;
    if (prevIndex >= 0) {
      goToSlide(prevIndex);
    }
  }, [currentSlideIndex, goToSlide]);
  
  // Timer and auto-advance
  useEffect(() => {
    if (isPlaying && mergedConfig.autoAdvance) {
      const slideDuration = currentSlide.duration || mergedConfig.autoAdvanceDelay;
      
      autoAdvanceRef.current = window.setTimeout(() => {
        nextSlide();
      }, slideDuration * 1000);
    }
    
    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
      }
    };
  }, [isPlaying, mergedConfig.autoAdvance, currentSlide, mergedConfig.autoAdvanceDelay, nextSlide]);
  
  useEffect(() => {
    if (enableTimer && isActive) {
      timerRef.current = window.setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enableTimer, isActive]);
  
  // Keyboard controls
  useEffect(() => {
    if (!enableKeyboardControls || !isActive) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'Space':
        case 'PageDown':
          event.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          event.preventDefault();
          prevSlide();
          break;
        case 'Home':
          event.preventDefault();
          goToSlide(0);
          break;
        case 'End':
          event.preventDefault();
          goToSlide(slides.length - 1);
          break;
        case 'f':
        case 'F':
          event.preventDefault();
          toggleFullscreen();
          break;
        case 'p':
        case 'P':
          event.preventDefault();
          setIsPlaying(prev => !prev);
          break;
        case 'Escape':
          if (isFullscreen) {
            exitFullscreen();
          } else {
            handleExit();
          }
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardControls, isActive, nextSlide, prevSlide, goToSlide, slides.length, toggleFullscreen, isFullscreen, exitFullscreen]);
  
  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);
  
  // Presentation lifecycle
  const handleStart = useCallback(() => {
    setIsActive(true);
    if (enableFullscreen) {
      enterFullscreen();
    }
  }, [enableFullscreen, enterFullscreen]);
  
  const handleExit = useCallback(() => {
    setIsActive(false);
    setIsPlaying(false);
    setIsFullscreen(false);
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    onExit?.();
  }, [onExit]);
  
  // Render slide content
  const renderSlide = () => {
    return (
      <div className={`${styles.slideContent} ${isTransitioning ? styles.transitioning : ''}`}>
        {currentSlide.content}
      </div>
    );
  };
  
  // Timer display
  const formatTimer = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // If not active, render start button
  if (!isActive) {
    return (
      <div className={styles.startContainer}>
        <div className={styles.startContent}>
          <h2>Presentation Mode</h2>
          <p>{slides.length} slides ready</p>
          <div className={styles.slideThumbnails}>
            {slides.slice(0, 5).map((slide, index) => (
              <div key={slide.id} className={styles.thumbnail}>
                <span className={styles.thumbnailNumber}>{index + 1}</span>
                <span className={styles.thumbnailTitle}>{slide.title}</span>
              </div>
            ))}
            {slides.length > 5 && (
              <div className={styles.thumbnailMore}>+{slides.length - 5} more</div>
            )}
          </div>
          <button className={styles.startButton} onClick={handleStart}>
            ▶ Start Presentation
          </button>
          <p className={styles.hint}>Press F for fullscreen, ESC to exit</p>
        </div>
      </div>
    );
  }
  
  return (
    <div
      ref={presentationRef}
      className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}
    >
      {/* Slide Content */}
      <div className={styles.slideContainer}>
        {renderSlide()}
      </div>
      
      {/* Controls Overlay */}
      {showControls && (
        <div className={styles.controls}>
          {/* Top Controls */}
          <div className={styles.controlsTop}>
            <div className={styles.slideInfo}>
              <span className={styles.slideTitle}>{currentSlide.title}</span>
              {mergedConfig.showSlideNumber && (
                <span className={styles.slideNumber}>
                  {currentSlideIndex + 1} / {slides.length}
                </span>
              )}
            </div>
            
            {enableTimer && mergedConfig.showTimer && (
              <div className={styles.timer}>
                ⏱ {formatTimer(timer)}
              </div>
            )}
            
            <div className={styles.topActions}>
              <button
                className={styles.controlButton}
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
              >
                {isFullscreen ? '⤓' : '⤢'}
              </button>
              <button
                className={styles.controlButton}
                onClick={handleExit}
                title="Exit (ESC)"
              >
                ✕
              </button>
            </div>
          </div>
          
          {/* Bottom Controls */}
          <div className={styles.controlsBottom}>
            <div className={styles.bottomLeft}>
              <button
                className={styles.navButton}
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
                title="Previous (←)"
              >
                ◀
              </button>
            </div>
            
            <div className={styles.bottomCenter}>
              <button
                className={`${styles.playButton} ${isPlaying ? styles.playing : ''}`}
                onClick={() => setIsPlaying(!isPlaying)}
                title={isPlaying ? 'Pause (P)' : 'Play (P)'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              
              <div className={styles.slideIndicators}>
                {slides.map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${index === currentSlideIndex ? styles.active : ''}`}
                    onClick={() => goToSlide(index)}
                    title={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            
            <div className={styles.bottomRight}>
              <button
                className={styles.navButton}
                onClick={nextSlide}
                disabled={currentSlideIndex === slides.length - 1 && !mergedConfig.loopSlideshow}
                title="Next (→)"
              >
                ▶
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Progress Bar */}
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${((currentSlideIndex + 1) / slides.length) * 100}%` }}
        />
      </div>
    </div>
  );
}

export default PresentationMode;
