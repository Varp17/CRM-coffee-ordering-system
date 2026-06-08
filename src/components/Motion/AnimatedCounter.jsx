import React, { useEffect, useRef, useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

/**
 * AnimatedCounter — smoothly animates a numeric value change.
 * Used in the Kiosk CustomDrink live price display.
 *
 * Props:
 *   value       {number}  - The target numeric value to display
 *   format      {string}  - 'currency' (default) | 'number'
 *   duration    {number}  - Animation duration in ms (default: 400)
 *   className   {string}  - Optional CSS class
 */
const AnimatedCounter = ({
  value = 0,
  format = 'currency',
  duration = 400,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const startRef = useRef(value);
  const startTimeRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const from = startRef.current;
    const to = value;

    if (from === to) return;

    // Cancel any running animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    startTimeRef.current = null;

    const step = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (to - from) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(to);
        startRef.current = to;
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted =
    format === 'currency'
      ? formatCurrency(displayValue)
      : Math.round(displayValue).toLocaleString('en-IN');

  return (
    <span className={`animated-counter ${className}`}>
      {formatted}
    </span>
  );
};

export default AnimatedCounter;
