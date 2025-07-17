import React from 'react';

interface PinPadProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  length?: number;
  disabled?: boolean;
}

const PinPad: React.FC<PinPadProps> = ({ value, onChange, onSubmit, length = 6, disabled }) => {
  const handleDigit = (d: string) => {
    if (disabled) return;
    if (value.length < length) onChange(value + d);
  };
  const handleBack = () => {
    if (disabled) return;
    onChange(value.slice(0, -1));
  };
  const handleSubmit = () => {
    if (disabled) return;
    if (value.length === length) onSubmit();
  };
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2 mb-2">
        {[...Array(length)].map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 ${i < value.length ? 'bg-primary border-primary' : 'border-muted'} transition`} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} className="w-16 h-16 rounded-full bg-muted text-2xl font-bold hover:bg-primary/20 transition" onClick={() => handleDigit(n.toString())} disabled={disabled}>{n}</button>
        ))}
        <div></div>
        <button className="w-16 h-16 rounded-full bg-muted text-2xl font-bold hover:bg-primary/20 transition" onClick={() => handleDigit('0')} disabled={disabled}>0</button>
        <button className="w-16 h-16 rounded-full bg-muted text-xl font-bold hover:bg-primary/20 transition" onClick={handleBack} disabled={disabled}>⌫</button>
      </div>
      <button className="mt-2 px-8 py-2 rounded bg-primary text-white font-semibold disabled:bg-muted" onClick={handleSubmit} disabled={disabled || value.length !== length}>Enter</button>
    </div>
  );
};

export default PinPad; 