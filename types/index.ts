import { Timestamp } from 'firebase/firestore';

// Tipos de plataformas suportadas
export type PlatformType =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'twitter'
  | 'youtube'
  | 'email'
  | 'whatsapp'
  | 'threads'
  | 'substack'
  | 'website';

// Configuração visual do tema
export interface ThemeConfig {
  // Cabeçalho
  avatarShape: 'circular' | 'quadrado' | 'fundo';
  // Fundo
  backgroundType: 'solido' | 'gradiente';
  backgroundColor: string;
  gradientTop?: string;
  gradientBottom?: string;
  // Textos
  titleFont: string;
  titleColor: string;
  descriptionFont: string;
  descriptionColor: string;
  linkFont: string;
  linkColor: string;
  // Botões
  buttonStyle: 'solido' | 'borda';
  buttonBorderRadius: 'retangular' | 'quadrado' | 'arredondado' | 'full';
  buttonColor: string;
  buttonTextColor: string;
  // Esquema de cores
  nameColor: string;
}

// Perfil do usuário — Collection: users/{uid}
export interface UserProfile {
  uid: string;
  username: string; // slug único: umbler.link/username
  displayName: string;
  title: string; // ex: "Advogado Trabalhista"
  bio: string;
  avatarUrl: string;
  phone: string;
  howFoundUs?: string;
  createdAt: Timestamp;
  theme: ThemeConfig;
}

// Link do usuário — Collection: users/{uid}/links/{linkId}
export interface Link {
  id: string;
  type: PlatformType | 'personalizado';
  title: string;
  url: string;
  iconUrl?: string;
  order: number;
  active: boolean;
  clickCount: number;
  createdAt: Timestamp;
}

// Evento de clique — Collection: clicks/{autoId}
export interface ClickEvent {
  linkId: string;
  userId: string;
  username: string;
  timestamp: Timestamp;
  device: 'mobile' | 'desktop' | 'tablet';
  country?: string;
}

// Tema pré-definido para o onboarding
export interface PresetTheme {
  id: string;
  nome: string;
  config: ThemeConfig;
}
