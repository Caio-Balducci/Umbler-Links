'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AvatarCropModalProps {
  imageSrc: string;
  onConfirmar: (blob: Blob) => Promise<void>;
  onCancelar: () => void;
}

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const img = await createImageBitmap(await (await fetch(imageSrc)).blob());
  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(
    img,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Falha ao gerar imagem'));
    }, 'image/jpeg', 0.92);
  });
}

async function comprimirBlob(blob: Blob): Promise<Blob> {
  const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
  const comprimido = await imageCompression(file, {
    maxSizeMB: 5,
    maxWidthOrHeight: 1024,
    useWebWorker: true,
  });
  return comprimido;
}

export function AvatarCropModal({ imageSrc, onConfirmar, onCancelar }: AvatarCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [salvando, setSalvando] = useState(false);

  const onCropComplete = useCallback((_: Area, pixelCrop: Area) => {
    setCroppedAreaPixels(pixelCrop);
  }, []);

  async function confirmar() {
    if (!croppedAreaPixels) return;
    setSalvando(true);
    try {
      const cropped = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const comprimido = await comprimirBlob(cropped);
      await onConfirmar(comprimido);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
        {/* Área de crop */}
        <div className="relative w-full" style={{ height: 300, background: '#111' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom */}
        <div className="px-5 pt-4 pb-1 space-y-1">
          <label className="text-xs font-medium text-gray-600">Zoom</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary cursor-pointer"
          />
        </div>

        {/* Ações */}
        <div className="flex gap-3 px-5 pb-5 pt-3">
          <button
            onClick={onCancelar}
            disabled={salvando}
            className="flex-1 rounded-lg border border-border py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={salvando}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
          >
            {salvando ? 'Salvando...' : 'Usar foto'}
          </button>
        </div>
      </div>
    </div>
  );
}
