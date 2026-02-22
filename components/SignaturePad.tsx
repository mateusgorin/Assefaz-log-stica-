import React, { useRef, useState, useEffect, useCallback } from 'react';

interface SignaturePadProps {
  label: string;
  onSave: (dataUrl: string) => void;
  onClear: () => void;
  colorClass: string;
  error?: boolean;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ label, onSave, onClear, colorClass, error }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      const { width } = container.getBoundingClientRect();
      // Ajusta o tamanho interno do canvas para a largura do container
      // Mantemos a proporção de altura
      canvas.width = width;
      canvas.height = 140;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#14213D';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [resizeCanvas]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const { x, y } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const { x, y } = getCoordinates(e);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onSave(canvas.toDataURL());
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onClear();
      }
    }
  };

  return (
    <div className="flex flex-col space-y-3 w-full">
      <div className="flex justify-between items-center">
        <label className={`text-[10px] font-bold uppercase tracking-widest ${error ? 'text-red-600' : 'text-slate-500'}`}>
          {label}
        </label>
        <button 
          type="button" 
          onClick={clear}
          className={`text-[10px] uppercase font-bold ${colorClass} hover:underline px-2 py-1`}
        >
          Limpar
        </button>
      </div>
      <div 
        ref={containerRef}
        className={`border bg-white transition-colors duration-200 w-full overflow-hidden ${error ? 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.1)]' : 'border-slate-200'}`}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
          className="w-full h-[140px] cursor-crosshair touch-none"
        />
      </div>
      <p className={`text-[9px] uppercase tracking-tighter ${error ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
        {error ? 'Assinatura obrigatória para validação' : 'Campo de assinatura eletrônica do sistema'}
      </p>
    </div>
  );
};

export default SignaturePad;