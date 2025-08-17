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
  const [initialWaiting, setInitialWaiting] = useState(true);
  const [initialWaitTimer, setInitialWaitTimer] = useState(null);
  
  const greetingTexts = useMemo(() => [
    "Hello there, welcome to my portfolio!",
    "I'm Basile, and I'm excited to show you my work.",
    "Let's explore together..."
  ], []);

  // Function to highlight specific words
  const highlightWords = (text) => {
    const wordsToHighlight = ['portfolio', 'Basile', 'explore'];
    let highlightedText = text;
    
    wordsToHighlight.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      highlightedText = highlightedText.replace(regex, `<span class="highlight-word">${word}</span>`);
    });
    
    return highlightedText;
  };

  // Function to get highlighting for partial text during typing
  const getPartialHighlight = (fullText, currentIndex) => {
    const wordsToHighlight = ['portfolio', 'Basile', 'explore'];
    const currentText = fullText.substring(0, currentIndex);
    let result = '';
    let i = 0;
    
    while (i < currentText.length) {
      let foundWord = false;
      
      // Check if we're at the start of a word to highlight
      for (const word of wordsToHighlight) {
        const wordStart = i;
        const wordEnd = i + word.length;
        
        // Check if this position starts with the highlight word (case insensitive)
        if (wordEnd <= fullText.length && 
            fullText.substring(wordStart, wordEnd).toLowerCase() === word.toLowerCase() &&
            (wordStart === 0 || !/\w/.test(fullText[wordStart - 1])) && // word boundary before
            (wordEnd === fullText.length || !/\w/.test(fullText[wordEnd]))) { // word boundary after
          
          // Check how much of this word we've typed so far
          const typedWordLength = Math.min(word.length, currentText.length - wordStart);
          
          if (typedWordLength > 0) {
            const typedPortion = fullText.substring(wordStart, wordStart + typedWordLength);
            result += `<span class="highlight-word">${typedPortion}</span>`;
            i = wordStart + typedWordLength;
            foundWord = true;
            break;
          }
        }
      }
      
      if (!foundWord) {
        result += currentText[i];
        i++;
      }
    }
    
    return result;
  };

  // Start initial wait timer on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialWaiting(false);
    }, 2000); // Wait before showing greeting

    setInitialWaitTimer(timer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, []);

  // Handle the typing animation
  useEffect(() => {
    // Don't run if still in initial waiting period
    if (initialWaiting) return;

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
            charIndex++;
            const partialText = getPartialHighlight(text, charIndex);
            setCurrentText(partialText);
          } else {
            clearInterval(typeWriter);
            setIsTyping(false);
            setCanAdvance(true);
            setTypewriterInterval(null);
            // Ensure final text has proper highlighting
            setCurrentText(highlightWords(text));
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
  }, [textIndex, greetingTexts, manualAdvance, initialWaiting]);

  const handleClick = () => {
    // If in initial waiting period, skip the wait
    if (initialWaiting) {
      if (initialWaitTimer) {
        clearTimeout(initialWaitTimer);
        setInitialWaitTimer(null);
      }
      setInitialWaiting(false);
      return;
    }

    // If currently typing, skip to full text
    if (isTyping && typewriterInterval) {
      clearInterval(typewriterInterval);
      setCurrentText(highlightWords(greetingTexts[textIndex]));
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
      className={`greeting-container ${fadeOut ? 'fade-out' : ''} ${initialWaiting ? 'waiting' : ''}`}
      onClick={handleClick}
    >
      <div className="greeting-content">
        {initialWaiting ? (
          <div></div>
        ) : (
          showText && (
            <div className={`rpg-textbox ${fadeOut ? 'fade-out' : ''}`}>
              <div className={`character-image ${fadeOut ? 'fade-out' : ''}`}>
                <img 
                  src="/portfolio/basile/basile_wave.png" 
                  alt="Basile greeting" 
                  className="basile-image"
                />
              </div>
              <div className="textbox-content">
                <p 
                  className="greeting-text" 
                  dangerouslySetInnerHTML={{ __html: currentText }}
                />
                <div className={`text-cursor ${canAdvance ? 'visible' : 'hidden'}`}>▼</div>
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}

export default GreetingSequence;