import React, { useState, useEffect, useMemo } from 'react';
import './GreetingSequence.css';

function GreetingSequence({ onComplete }) {
  const [showGreeting, setShowGreeting] = useState(true);
  const [showText, setShowText] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [canAdvance, setCanAdvance] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [typewriterInterval, setTypewriterInterval] = useState(null);
  const [manualAdvance, setManualAdvance] = useState(false);
  
  const greetingTexts = useMemo(() => [
    "Hello there, welcome to my portfolio!",
    "I'm Basile, and I'm excited to show you my work.",
    "Let's explore together..."
  ], []);

  useEffect(() => {
    // Don't run useEffect if we manually advanced
    if (manualAdvance) {
      setManualAdvance(false);
      return;
    }

    // Start showing text after a brief delay
    const textTimer = setTimeout(() => {
      setShowText(true);
      
      // Start typing function moved inside useEffect
      if (textIndex < greetingTexts.length) {
        setIsTyping(true);
        setCanAdvance(false);
        const text = greetingTexts[textIndex];
        let charIndex = 0;
        
        const typeWriter = setInterval(() => {
          if (charIndex < text.length) {
            setCurrentText(text.substring(0, charIndex + 1));
            charIndex++;
          } else {
            clearInterval(typeWriter);
            setIsTyping(false);
            setCanAdvance(true);
            setTypewriterInterval(null);
          }
        }, 50);

        setTypewriterInterval(typeWriter);

        return () => {
          clearTimeout(textTimer);
          clearInterval(typeWriter);
        };
      }
    }, textIndex === 0 ? 500 : 0);

    return () => clearTimeout(textTimer);
  }, [textIndex, greetingTexts, manualAdvance]);

  const handleClick = () => {
    // If currently typing, skip to full text
    if (isTyping && typewriterInterval) {
      clearInterval(typewriterInterval);
      setCurrentText(greetingTexts[textIndex]);
      setIsTyping(false);
      setCanAdvance(true);
      setTypewriterInterval(null);
      return;
    }

    if (!canAdvance) return;
    
    if (textIndex < greetingTexts.length - 1) {
      // Clear any existing interval
      if (typewriterInterval) {
        clearInterval(typewriterInterval);
        setTypewriterInterval(null);
      }
      
      // Simply advance to next text and let useEffect handle the typing
      setTextIndex(textIndex + 1);
      setCurrentText('');
      setCanAdvance(false);
      setIsTyping(false);
      // Remove setManualAdvance(true) to let useEffect run normally
    } else {
      // Start fade out sequence
      setFadeOut(true);
      setTimeout(() => {
        setShowGreeting(false);
        setTimeout(() => {
          onComplete();
        }, 500);
      }, 1000);
    }
  };

  if (!showGreeting) return null;

  return (
    <div 
      className={`greeting-container ${fadeOut ? 'fade-out' : ''}`}
      onClick={handleClick}
    >
      <div className="greeting-content">
        {showText && (
          <div className={`rpg-textbox ${fadeOut ? 'fade-out' : ''}`}>
            <div className={`character-image ${fadeOut ? 'fade-out' : ''}`}>
              <img 
                src="/portfolio/basile/basile_wave.png" 
                alt="Basile greeting" 
                className="basile-image"
              />
            </div>
            <div className="textbox-content">
              <p className="greeting-text">{currentText}</p>
              <div className={`text-cursor ${canAdvance ? 'visible' : 'hidden'}`}>▼</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GreetingSequence;