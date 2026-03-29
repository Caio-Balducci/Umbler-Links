'use client';

import { useEffect } from 'react';
import { UserProfile, Link as LinkType } from '@/types';
import { PLATFORMS } from '@/lib/platforms';
import { temaDefault } from '@/lib/tema-default';
import Link from 'next/link';
import Image from 'next/image';

interface PaginaPublicaProps {
  perfil: UserProfile;
  links: LinkType[];
}

function registrarClique(linkId: string, userId: string, username: string) {
  fetch('/api/click', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ linkId, userId, username }),
  }).catch(() => {});
}

function registrarVisita(userId: string, username: string) {
  fetch('/api/visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, username }),
  }).catch(() => {});
}

export default function PaginaPublica({ perfil, links }: PaginaPublicaProps) {
  const tema = perfil.theme ?? temaDefault();

  // Registra visita uma vez ao montar a página
  useEffect(() => {
    registrarVisita(perfil.uid, perfil.username);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const avatarShape =
    tema.avatarShape === 'circular' ? '9999px' : '10px';

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 py-10"
      style={bgStyle}
    >
      <div className="w-full max-w-sm flex flex-col items-center gap-4">
        {/* Avatar */}
        {perfil.avatarUrl ? (
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: avatarShape,
              overflow: 'hidden',
              flexShrink: 0,
              padding: tema.avatarShape === 'fundo' ? '6px' : 0,
              backgroundColor: tema.avatarShape === 'fundo' ? 'rgba(255,255,255,0.2)' : undefined,
            }}
          >
            <Image
              src={perfil.avatarUrl}
              alt={perfil.displayName}
              width={96}
              height={96}
              style={{
                objectFit: 'cover',
                borderRadius: tema.avatarShape === 'circular' ? '9999px' : '6px',
                width: '100%',
                height: '100%',
              }}
              priority
            />
          </div>
        ) : (
          <div
            className="flex items-center justify-center text-2xl font-bold"
            style={{
              width: 96,
              height: 96,
              borderRadius: avatarShape,
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: tema.nameColor,
            }}
          >
            {perfil.displayName?.[0] ?? '?'}
          </div>
        )}

        {/* Nome */}
        <h1
          className="text-xl font-bold text-center"
          style={{ color: tema.nameColor, fontFamily: fontMap[tema.titleFont] }}
        >
          {perfil.displayName}
        </h1>

        {/* Título */}
        {perfil.title && (
          <p
            className="text-sm text-center -mt-2"
            style={{ color: tema.titleColor, fontFamily: fontMap[tema.titleFont] }}
          >
            {perfil.title}
          </p>
        )}

        {/* Bio */}
        {perfil.bio && (
          <p
            className="text-sm text-center leading-relaxed"
            style={{ color: tema.descriptionColor, fontFamily: fontMap[tema.descriptionFont] }}
          >
            {perfil.bio}
          </p>
        )}

        {/* Links */}
        <div className="w-full space-y-3 mt-2">
          {links.map((link) => {
            const plat = link.type !== 'personalizado' ? PLATFORMS[link.type] : null;
            const isEmail = link.type === 'email';
            const href = isEmail
              ? link.url.startsWith('mailto:') ? link.url : `mailto:${link.url}`
              : link.url;

            return (
              <a
                key={link.id}
                href={href}
                target={isEmail ? undefined : '_blank'}
                rel={isEmail ? undefined : 'noopener noreferrer'}
                onClick={() => registrarClique(link.id, perfil.uid, perfil.username)}
                className="flex items-center justify-center gap-2.5 w-full py-3 px-5 font-medium transition-opacity hover:opacity-85 active:opacity-70"
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
                  fontSize: '0.9rem',
                }}
              >
                {plat && (
                  <plat.icon
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: tema.buttonTextColor }}
                  />
                )}
                {link.title}
              </a>
            );
          })}
        </div>

        {/* Upsell */}
        <div className="mt-8 text-center">
          <Link
            href="/cadastro"
            className="text-xs opacity-50 hover:opacity-80 transition-opacity"
            style={{ color: tema.nameColor }}
          >
            Crie sua página grátis · Umbler Link
          </Link>
        </div>
      </div>
    </div>
  );
}
