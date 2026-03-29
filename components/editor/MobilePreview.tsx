'use client';

import { UserProfile, Link as LinkType } from '@/types';
import { PLATFORMS } from '@/lib/platforms';

interface MobilePreviewProps {
  perfil: UserProfile | null;
  links: LinkType[];
}

export function MobilePreview({ perfil, links }: MobilePreviewProps) {
  if (!perfil) return null;

  const tema = perfil.theme;
  const isGrad = tema.backgroundType === 'gradiente';

  const bgStyle = isGrad
    ? { background: `linear-gradient(to bottom, ${tema.gradientTop}, ${tema.gradientBottom})` }
    : { backgroundColor: tema.backgroundColor };

  const borderRadiusBtn =
    tema.buttonBorderRadius === 'full'
      ? '9999px'
      : tema.buttonBorderRadius === 'arredondado'
        ? '8px'
        : tema.buttonBorderRadius === 'quadrado'
          ? '4px'
          : '0px'; // retangular

  const fontMap: Record<string, string> = {
    Inter: '"Inter", sans-serif',
    Roboto: '"Roboto", sans-serif',
    Poppins: '"Poppins", sans-serif',
    'Playfair Display': '"Playfair Display", serif',
    'Space Mono': '"Space Mono", monospace',
  };

  const linksAtivos = links.filter((l) => l.active);

  return (
    <div className="flex-shrink-0 mx-auto w-[270px]">
      {/* Contorno do smartphone */}
      <div className="rounded-[2.5rem] border-[6px] border-gray-800 bg-white shadow-2xl overflow-hidden">
        {/* Câmera */}
        <div className="flex justify-center py-2 bg-gray-800">
          <div className="h-2 w-14 rounded-full bg-gray-600" />
        </div>

        {/* Tela */}
        <div
          className="overflow-y-auto"
          style={{ ...bgStyle, minHeight: '520px', maxHeight: '520px' }}
        >
          <div className="flex flex-col items-center px-4 py-6 gap-3">
            {/* Avatar */}
            <div
              className="overflow-hidden flex-shrink-0"
              style={{
                width: 64,
                height: 64,
                borderRadius:
                  tema.avatarShape === 'circular'
                    ? '9999px'
                    : tema.avatarShape === 'quadrado'
                      ? '8px'
                      : '8px',
                backgroundColor: tema.avatarShape === 'fundo' ? 'rgba(255,255,255,0.2)' : undefined,
                padding: tema.avatarShape === 'fundo' ? '4px' : undefined,
              }}
            >
              {perfil.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={perfil.avatarUrl}
                  alt={perfil.displayName}
                  className="w-full h-full object-cover"
                  style={{
                    borderRadius:
                      tema.avatarShape === 'circular' ? '9999px' : '4px',
                  }}
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center text-xl font-bold"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.3)',
                    color: tema.nameColor,
                    borderRadius: tema.avatarShape === 'circular' ? '9999px' : '4px',
                  }}
                >
                  {perfil.displayName?.[0] ?? '?'}
                </div>
              )}
            </div>

            {/* Nome */}
            <p
              className="text-sm font-bold text-center leading-tight"
              style={{ color: tema.nameColor, fontFamily: fontMap[tema.titleFont] }}
            >
              {perfil.displayName}
            </p>

            {/* Ícones das plataformas — flat design */}
            {(() => {
              const vistos = new Set<string>();
              const unicos = linksAtivos
                .filter((l) => l.type !== 'personalizado')
                .filter((l) => { if (vistos.has(l.type)) return false; vistos.add(l.type); return true; });
              if (unicos.length === 0) return null;
              return (
                <div className="flex items-center gap-1.5 flex-wrap justify-center -mt-0.5">
                  {unicos.map((l) => {
                    const p = PLATFORMS[l.type as keyof typeof PLATFORMS];
                    return (
                      <div key={l.type} className="h-5 w-5 rounded bg-white flex items-center justify-center shadow-sm">
                        <p.icon className="h-2.5 w-2.5" style={{ color: p.color }} />
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Título */}
            {perfil.title && (
              <p
                className="text-xs text-center"
                style={{ color: tema.titleColor, fontFamily: fontMap[tema.titleFont] }}
              >
                {perfil.title}
              </p>
            )}

            {/* Bio */}
            {perfil.bio && (
              <p
                className="text-[10px] text-center leading-relaxed px-1"
                style={{
                  color: tema.descriptionColor,
                  fontFamily: fontMap[tema.descriptionFont],
                }}
              >
                {perfil.bio}
              </p>
            )}

            {/* Links */}
            <div className="w-full space-y-2 mt-1">
              {linksAtivos.map((link) => {
                const plat = link.type !== 'personalizado' ? PLATFORMS[link.type] : null;

                return (
                  <div
                    key={link.id}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium"
                    style={{
                      backgroundColor:
                        tema.buttonStyle === 'borda' ? 'transparent' : tema.buttonColor,
                      color: tema.buttonTextColor,
                      borderRadius: borderRadiusBtn,
                      border:
                        tema.buttonStyle === 'borda'
                          ? `1.5px solid ${tema.buttonColor}`
                          : 'none',
                      fontFamily: fontMap[tema.linkFont],
                    }}
                  >
                    {plat && (
                      <plat.icon className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    <span className="truncate">{link.title}</span>
                  </div>
                );
              })}
            </div>

            {/* Upsell */}
            <p className="text-[9px] mt-2 opacity-50" style={{ color: tema.nameColor }}>
              Crie sua página grátis • umbler.link
            </p>
          </div>
        </div>
      </div>

      {/* Sombra embaixo */}
      <div className="mx-auto mt-3 h-4 w-3/4 rounded-full bg-gray-900/20 blur-md" />
    </div>
  );
}
