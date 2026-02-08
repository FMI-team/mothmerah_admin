import arTranslations from '@/locales/ar.json';
import enTranslations from '@/locales/en.json';

type TranslationKey = string;
type Locale = 'ar' | 'en';

const translations: Record<Locale, unknown> = {
    ar: arTranslations,
    en: enTranslations,
};

export function getTranslation(key: TranslationKey, locale: Locale = 'ar'): string {
    const keys = key.split('.');
    let value: unknown = translations[locale];

    for (const k of keys) {
        if (
            value &&
            typeof value === 'object' &&
            value !== null &&
            Object.prototype.hasOwnProperty.call(value, k)
        ) {
            value = (value as Record<string, unknown>)[k];
        } else {
            if (locale !== 'ar') {
                return getTranslation(key, 'ar');
            }
            return key;
        }
    }

    return typeof value === 'string' ? value : key;
}

export function useTranslations(locale: Locale = 'ar') {
    const t = (key: TranslationKey): string => {
        return getTranslation(key, locale);
    };

    return { t };
}
