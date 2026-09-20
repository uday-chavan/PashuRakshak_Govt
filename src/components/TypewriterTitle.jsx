import { useState, useEffect } from 'react';

export default function TypewriterTitle({
  text,
  speed = 28,
  delay = 40,
  className = '',
  as: Component = 'h1',
  cursor = true,
  children,
}) {
  const targetText = text || (typeof children === 'string' ? children : '');
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let currentIdx = 0;
    setDisplayedText('');
    setIsTyping(true);

    let interval = null;
    const startTimeout = setTimeout(() => {
      interval = setInterval(() => {
        currentIdx++;
        setDisplayedText(targetText.slice(0, currentIdx));
        if (currentIdx >= targetText.length) {
          clearInterval(interval);
          setIsTyping(false);
        }
      }, speed);
    }, delay);

    return () => {
      clearTimeout(startTimeout);
      if (interval) clearInterval(interval);
    };
  }, [targetText, speed, delay]);

  return (
    <Component className={`typing-title ${className}`.trim()}>
      <span className="typing-text">{displayedText}</span>
      {cursor && (
        <span
          className={`typing-cursor ${isTyping ? 'active' : 'done'}`}
          aria-hidden="true"
        >
          ▎
        </span>
      )}
    </Component>
  );
}
