import React, { useEffect, useRef } from 'react';

interface PinPadProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  length?: number;
  disabled?: boolean;
  shake?: boolean;
}

const PinPad: React.FC<PinPadProps> = ({ value, onChange, onSubmit, length = 6, disabled, shake }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (value.length === length && !disabled) {
      const timeout = setTimeout(() => onSubmit(), 120);
      return () => clearTimeout(timeout);
    }
  }, [value, length, onSubmit, disabled]);

  // Shake animation on error
  useEffect(() => {
    if (shake && containerRef.current) {
      containerRef.current.classList.add('animate-shake');
      const timeout = setTimeout(() => {
        containerRef.current?.classList.remove('animate-shake');
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [shake]);

  const handleDigit = (d: string) => {
    if (disabled) return;
    if (value.length < length) onChange(value + d);
  };
  const handleBack = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-6 w-full max-w-xs mx-auto">
      {/* Dots */}
      <div className="flex gap-3 mb-2 justify-center">
        {[...Array(length)].map((_, i) => (
          <div
            key={i}
            className={`w-5 h-5 sm:w-7 sm:h-7 rounded-full border-2 ${i < value.length ? 'bg-primary border-primary' : 'border-muted'} transition-all duration-150`}
            style={{ boxShadow: i < value.length ? '0 0 8px #6366f1' : undefined }}
          />
        ))}
      </div>
      {/* PIN Pad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button
            key={n}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted text-3xl font-bold hover:bg-primary/20 transition shadow-md active:scale-95"
            onClick={() => handleDigit(n.toString())}
            disabled={disabled || value.length === length}
            style={{ touchAction: 'manipulation' }}
          >
            {n}
          </button>
        ))}
        <div></div>
        <button
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted text-3xl font-bold hover:bg-primary/20 transition shadow-md active:scale-95"
          onClick={() => handleDigit('0')}
          disabled={disabled || value.length === length}
          style={{ touchAction: 'manipulation' }}
        >
          0
        </button>
        <button
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted text-2xl font-bold hover:bg-primary/20 transition shadow-md active:scale-95"
          onClick={handleBack}
          disabled={disabled || value.length === 0}
          style={{ touchAction: 'manipulation' }}
        >
          ⌫
        </button>
      </div>
      <style jsx global>{`
        @keyframes shake {
          10%, 90% { transform: translateX(-2px); }
          20%, 80% { transform: translateX(4px); }
          30%, 50%, 70% { transform: translateX(-8px); }
          40%, 60% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
    </div>
  );
};

export default PinPad; 