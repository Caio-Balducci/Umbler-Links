import { ThemeConfig } from '@/types';

export function temaDefault(): ThemeConfig {
  return {
    avatarShape: 'circular',
    backgroundType: 'solido',
    backgroundColor: '#ffffff',
    titleFont: 'Inter',
    titleColor: '#111827',
    descriptionFont: 'Inter',
    descriptionColor: '#6b7280',
    linkFont: 'Inter',
    linkColor: '#ffffff',
    buttonStyle: 'solido',
    buttonBorderRadius: 'quadrado',
    buttonColor: '#6B2FD9',
    buttonTextColor: '#ffffff',
    nameColor: '#111827',
  };
}
