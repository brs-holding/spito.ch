import deTranslations from '../translations/de.json';

type TranslationKey = string;

const translations = {
  de: deTranslations
};

export function t(key: TranslationKey): string {
  const keys = key.split('.');
  let value: any = translations.de;
  
  for (const k of keys) {
    if (value[k] === undefined) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    value = value[k];
  }
  
  return value;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}
