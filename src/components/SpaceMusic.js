import React, { useRef, useEffect, useState } from 'react';
import './SpaceMusic.css';

function SpaceMusic({ isPlaying = true, volume = 0.3 }) {
  const audioRef = useRef();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

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

  // Auto-start music when loaded
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !isLoaded || hasStarted) return;

    if (isPlaying && !isMuted) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setHasStarted(true);
        }).catch(error => {
          console.log('Autoplay prevented by browser:', error);
          // Try to play on user interaction
          const handleUserInteraction = () => {
            audio.play().then(() => {
              setHasStarted(true);
            }).catch(console.error);
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
          };
          
          document.addEventListener('click', handleUserInteraction);
          document.addEventListener('keydown', handleUserInteraction);
        });
      }
    }
  }, [isLoaded, isPlaying, isMuted, hasStarted]);

  // Handle play/pause when props change
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !hasStarted) return;

    if (isPlaying && !isMuted) {
      if (audio.paused) {
        audio.play().catch(console.error);
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [isPlaying, isMuted, hasStarted]);

  const handleToggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audio.muted = newMutedState;

    // If unmuting and not started yet, try to start
    if (!newMutedState && !hasStarted && isPlaying) {
      audio.play().then(() => {
        setHasStarted(true);
      }).catch(console.error);
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
      <div className="music-controls">
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
