import { useState, useEffect } from 'react';

/**
 * AnimatedNumber Component
 * Smoothly animates numbers from 0 to `value` using easeOutCubic interpolation.
 * Supports integers, floats, currency/locale formatting, prefixes (+, $, etc.), and suffixes (%, cases, etc.).
 */
export default function AnimatedNumber({
  value,
  duration = 850,
  prefix = '',
  suffix = '',
  decimals = 0,
  locale = 'en-IN',
  className = '',
}) {
  // Extract numeric part and any prefix/suffix if value is a string (like "+18" or "82%")
  let targetNum = 0;
  let autoPrefix = prefix;
  let autoSuffix = suffix;

  if (typeof value === 'number') {
    targetNum = isNaN(value) ? 0 : value;
  } else if (typeof value === 'string') {
    // Check for leading + or -
    const trimmed = value.trim();
    if (trimmed.startsWith('+') && !autoPrefix) {
      autoPrefix = '+';
    }
    if (trimmed.endsWith('%') && !autoSuffix) {
      autoSuffix = '%';
    }
    const cleanStr = trimmed.replace(/[^0-9.-]+/g, '');
    targetNum = parseFloat(cleanStr) || 0;
  }

  const [currentNum, setCurrentNum] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let animationFrameId = null;
    const startNum = 0;

    // easeOutCubic curve for a snappy, satisfying deceleration
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const val = startNum + (targetNum - startNum) * easedProgress;

      setCurrentNum(val);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      } else {
        setCurrentNum(targetNum);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [targetNum, duration]);

  const formattedValue = decimals > 0
    ? currentNum.toLocaleString(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : Math.round(currentNum).toLocaleString(locale);

  return (
    <span className={`animated-number ${className}`}>
      {autoPrefix}{formattedValue}{autoSuffix}
    </span>
  );
}
