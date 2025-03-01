import React, { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { hexToRgb } from '../utils/colorUtils';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  onFinalChange: (color: string) => void;
  rgb: { r: number; g: number; b: number };
  onRgbChange: (component: 'r' | 'g' | 'b', value: number) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  color,
  onChange,
  onFinalChange,
  rgb,
  onRgbChange,
}) => {
  const [hexInput, setHexInput] = useState(color);

  useEffect(() => {
    setHexInput(color);
  }, [color]);

  const handleRgbInputChange = (component: 'r' | 'g' | 'b', value: string) => {
    // Sayısal değeri doğrudan al, boş ise 0 kullan
    const numValue = value === '' ? 0 : parseInt(value);
    
    // Değer sınırlarını kontrol et
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 255) {
      onRgbChange(component, numValue);
    }
  };

  const handleRgbKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, component: 'r' | 'g' | 'b', currentValue: number) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const newValue = e.key === 'ArrowUp' 
        ? Math.min(255, currentValue + step)
        : Math.max(0, currentValue - step);
      onRgbChange(component, newValue);
    }
  };

  const handleHexChange = (value: string) => {
    setHexInput(value);
    // Hex kodu geçerli mi kontrol et
    const hexRegex = /^#?([A-Fa-f0-9]{6})$/;
    if (hexRegex.test(value)) {
      const normalizedHex = value.startsWith('#') ? value : `#${value}`;
      onChange(normalizedHex.toUpperCase());
      onFinalChange(normalizedHex.toUpperCase());
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <style>{`
        .react-colorful {
          width: 260px !important;
          height: 180px !important;
          border-radius: 4px;
          gap: 3px;
          padding: 8px;
          background: white;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .react-colorful__saturation {
          border-radius: 2px;
          border-bottom: none;
          margin-bottom: 1px;
        }
        .react-colorful__hue {
          height: 12px !important;
          border-radius: 2px;
        }
        .react-colorful__pointer {
          width: 16px;
          height: 16px;
          border-width: 1.5px;
          border-color: white;
          box-shadow: 0 1px 1px rgba(0,0,0,0.2);
        }
        .react-colorful__saturation-pointer {
          border-width: 2px;
        }
        .react-colorful__interactive:focus .react-colorful__pointer {
          transform: translate(-50%, -50%) scale(1.1);
        }
      `}</style>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3">
          <div className="rounded-sm overflow-hidden flex justify-center">
            <HexColorPicker 
              color={color} 
              onChange={(newColor) => {
                onChange(newColor.toUpperCase());
              }}
              onMouseUp={(e) => {
                // Mouse bırakıldığında final değişikliği bildir
                const target = e.target as HTMLElement;
                const canvas = target.closest('canvas');
                if (canvas) {
                  onFinalChange(color);
                }
              }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['r', 'g', 'b'].map((component) => (
              <div key={component} className="flex flex-col">
                <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border shadow-sm">
                  <label className="text-xs font-medium text-gray-500">{component.toUpperCase()}</label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={rgb[component as 'r' | 'g' | 'b']}
                    onChange={(e) => handleRgbInputChange(component as 'r' | 'g' | 'b', e.target.value)}
                    onKeyDown={(e) => handleRgbKeyDown(e, component as 'r' | 'g' | 'b', rgb[component as 'r' | 'g' | 'b'])}
                    className="w-full text-base font-medium bg-transparent border-none focus:outline-none focus:ring-0"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center">
            <div className="flex-1">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white rounded-lg border shadow-sm">
                <span className="text-sm font-mono font-medium text-gray-600">#</span>
                <input
                  type="text"
                  value={hexInput.replace('#', '')}
                  onChange={(e) => handleHexChange(e.target.value)}
                  className="flex-1 font-mono text-sm font-medium bg-transparent border-none focus:outline-none focus:ring-0 uppercase"
                  spellCheck={false}
                  autoFocus
                  onFocus={(e) => e.target.select()}
                />
                <div 
                  className="w-4 h-4 rounded-md"
                  style={{ backgroundColor: color }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
