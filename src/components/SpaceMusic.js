import React, { useRef, useEffect, useState } from 'react';
import './SpaceMusic.css';

function SpaceMusic({ isPlaying = true, volume = 0.3, dashboardOpen = false }) {
  const audioRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleCanPlayThrough = () => {
      setIsLoaded(true);
    };

    const handleError = (e) => {
      console.error('Error loading space music:', e);
    };

    // Set initial volume
    audio.volume = volume;

    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
    };
  }, [volume]);

  // Listen for first user interaction
  useEffect(() => {
    if (hasUserInteracted) return;

    const handleFirstInteraction = () => {
      setHasUserInteracted(true);
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keydown', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keydown', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [hasUserInteracted]);

  // Start music when loaded and user has interacted
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isLoaded || !hasUserInteracted) return;

    if (isPlaying && !isMuted) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log('Failed to play music:', error);
        });
      }
    }
  }, [isLoaded, hasUserInteracted, isPlaying, isMuted]);

  // Handle play/pause when props change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hasUserInteracted) return;

    if (isPlaying && !isMuted) {
      if (audio.paused) {
        audio.play().catch(console.error);
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [isPlaying, isMuted, hasUserInteracted]);

  const handleToggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audio.muted = newMutedState;

    // If unmuting and user has interacted, try to start
    if (!newMutedState && hasUserInteracted && isPlaying) {
      audio.play().catch(console.error);
    }
  };

  return (
    <>
      <audio
        ref={audioRef}
        loop
        preload="auto"
        playsInline
      >
        <source src="/portfolio/Space.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      {/* Music Controls */}
      <div className={`music-controls ${dashboardOpen ? 'dashboard-open' : ''}`}>
        <button 
          className="mute-toggle-btn"
          onClick={handleToggleMute}
          title={isMuted ? "Unmute Music" : "Mute Music"}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>
    </>
  );
}

export default SpaceMusic;
