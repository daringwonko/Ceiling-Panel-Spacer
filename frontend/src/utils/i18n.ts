/**
 * Internationalization (i18n) Foundation
 * Multi-language support for BIM Workbench
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Translation dictionary type
type TranslationDict = Record<string, string | TranslationDict>;

// Language definition
interface Language {
  code: string;
  name: string;
  nativeName: string;
  direction: 'ltr' | 'rtl';
}

// Available languages
export const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', direction: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', direction: 'ltr' },
  { code: 'fr', name: 'French', nativeName: 'Français', direction: 'ltr' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', direction: 'ltr' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', direction: 'ltr' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', direction: 'ltr' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', direction: 'ltr' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', direction: 'rtl' },
];

// English translations (default)
const EN_TRANSLATIONS: TranslationDict = {
  // Common
  'common.ok': 'OK',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.close': 'Close',
  'common.back': 'Back',
  'common.next': 'Next',
  'common.finish': 'Finish',
  'common.skip': 'Skip',
  'common.search': 'Search',
  'common.loading': 'Loading...',
  'common.error': 'Error',
  'common.success': 'Success',

  // Navigation
  'nav.file': 'File',
  'nav.edit': 'Edit',
  'nav.view': 'View',
  'nav.tools': 'Tools',
  'nav.help': 'Help',

  // File menu
  'file.new': 'New Project',
  'file.open': 'Open Project',
  'file.save': 'Save',
  'file.saveAs': 'Save As',
  'file.export': 'Export',
  'file.print': 'Print',
  'file.exit': 'Exit',

  // Edit menu
  'edit.undo': 'Undo',
  'edit.redo': 'Redo',
  'edit.cut': 'Cut',
  'edit.copy': 'Copy',
  'edit.paste': 'Paste',
  'edit.delete': 'Delete',
  'edit.selectAll': 'Select All',

  // 2D Tools
  'tool.line': 'Line',
  'tool.rectangle': 'Rectangle',
  'tool.circle': 'Circle',
  'tool.arc': 'Arc',
  'tool.polyline': 'Polyline',
  'tool.polygon': 'Polygon',
  'tool.ellipse': 'Ellipse',

  // 3D Tools
  'tool.wall': 'Wall',
  'tool.floor': 'Floor',
  'tool.door': 'Door',
  'tool.window': 'Window',
  'tool.column': 'Column',
  'tool.beam': 'Beam',

  // Selection Tools
  'tool.select': 'Select',
  'tool.move': 'Move',
  'tool.rotate': 'Rotate',
  'tool.scale': 'Scale',
  'tool.mirror': 'Mirror',
  'tool.trim': 'Trim',
  'tool.offset': 'Offset',

  // View
  'view.zoomIn': 'Zoom In',
  'view.zoomOut': 'Zoom Out',
  'view.zoomFit': 'Fit to Screen',
  'view.pan': 'Pan',
  'view.top': 'Top View',
  'view.front': 'Front View',
  'view.side': 'Side View',
  'view.perspective': '3D Perspective',

  // Panels
  'panel.properties': 'Properties',
  'panel.hierarchy': 'Hierarchy',
  'panel.materials': 'Materials',
  'panel.layers': 'Layers',
  'panel.views': 'Views',

  // Welcome Screen
  'welcome.title': 'BIM Workbench',
  'welcome.subtitle': 'Building Information Modeling for Professionals',
  'welcome.newProject': 'New Project',
  'welcome.openProject': 'Open Project',
  'welcome.recentProjects': 'Recent Projects',
  'welcome.demoProject': 'Demo Project',
  'welcome.tutorials': 'Tutorials',
  'welcome.documentation': 'Documentation',
  'welcome.support': 'Support',

  // Messages
  'msg.unsavedChanges': 'You have unsaved changes. Do you want to save before exiting?',
  'msg.projectSaved': 'Project saved successfully',
  'msg.exportComplete': 'Export completed',
  'msg.undo': 'Undone',
  'msg.redo': 'Redone',

  // Errors
  'error.generic': 'An error occurred',
  'error.fileNotFound': 'File not found',
  'error.invalidFormat': 'Invalid file format',
  'error.exportFailed': 'Export failed',

  // Accessibility
  'a11y.skipToContent': 'Skip to main content',
  'a11y.mainContent': 'Main content',
  'a11y.toggleSidebar': 'Toggle sidebar',
  'a11y.closeMenu': 'Close menu',
};

// Load translation for a language
const loadTranslation = async (code: string): Promise<TranslationDict> => {
  // For now, return English (in production, would load from JSON files)
  if (code === 'en') {
    return EN_TRANSLATIONS;
  }

  // Placeholder for loading translations
  // In production: const response = await fetch(`/i18n/${code}.json`);
  // return response.json();

  return EN_TRANSLATIONS;
};

// i18n Context
interface I18nContextType {
  language: Language;
  setLanguage: (code: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: Language[];
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

// i18n Provider
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(LANGUAGES[0]);
  const [translations, setTranslations] = useState<TranslationDict>(EN_TRANSLATIONS);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language from localStorage
  useEffect(() => {
    const initLanguage = async () => {
      const savedCode = localStorage.getItem('bim-workbench-language');
      const code = savedCode || navigator.language.split('-')[0] || 'en';

      const lang = LANGUAGES.find(l => l.code === code) || LANGUAGES[0];

      try {
        const translation = await loadTranslation(code);
        setTranslations(translation);
        setLanguageState(lang);
      } catch (error) {
        console.error('Failed to load translations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initLanguage();
  }, []);

  const setLanguage = useCallback(async (code: string) => {
    setIsLoading(true);

    const lang = LANGUAGES.find(l => l.code === code);
    if (!lang) {
      setIsLoading(false);
      return;
    }

    try {
      const translation = await loadTranslation(code);
      setTranslations(translation);
      setLanguageState(lang);
      localStorage.setItem('bim-workbench-language', code);

      // Update document direction for RTL languages
      document.documentElement.dir = lang.direction;
      document.documentElement.lang = code;
    } catch (error) {
      console.error('Failed to load translations:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    let text = translations[key];

    if (typeof text !== 'string') {
      // Fallback to English
      text = EN_TRANSLATIONS[key] || key;
    }

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        text = text.replace(`{{${key}}}`, String(value));
      });
    }

    return text;
  }, [translations]);

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
};

// Hook to use translations
export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};

// Date formatting utility
export const formatDate = (date: Date, format: 'short' | 'long' = 'short'): string => {
  const { language } = useTranslation();

  if (format === 'long') {
    return new Intl.DateTimeFormat(language.code, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  return new Intl.DateTimeFormat(language.code, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Number formatting utility
export const formatNumber = (num: number, options?: Intl.NumberFormatOptions): string => {
  const { language } = useTranslation();
  return new Intl.NumberFormat(language.code, options).format(num);
};

// Unit formatting utility (length)
export const formatLength = (mm: number, unit: 'mm' | 'cm' | 'm' | 'in' | 'ft' = 'mm'): string => {
  const { t } = useTranslation();

  switch (unit) {
    case 'mm':
      return `${Math.round(mm)} ${t('unit.mm')}`;
    case 'cm':
      return `${(mm / 10).toFixed(1)} ${t('unit.cm')}`;
    case 'm':
      return `${(mm / 1000).toFixed(2)} ${t('unit.m')}`;
    case 'in':
      return `${(mm / 25.4).toFixed(1)} ${t('unit.in')}`;
    case 'ft':
      return `${(mm / 304.8).toFixed(2)} ${t('unit.ft')}`;
    default:
      return `${mm} mm`;
  }
};

// Currency formatting utility
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const { language } = useTranslation();
  return new Intl.NumberFormat(language.code, {
    style: 'currency',
    currency
  }).format(amount);
};

// Relative time utility
export const formatRelativeTime = (date: Date): string => {
  const { language } = useTranslation();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(language.code, { numeric: 'auto' });

  if (diffSec < 60) {
    return rtf.format(-diffSec, 'second');
  } else if (diffMin < 60) {
    return rtf.format(-diffMin, 'minute');
  } else if (diffHour < 24) {
    return rtf.format(-diffHour, 'hour');
  } else if (diffDay < 30) {
    return rtf.format(-diffDay, 'day');
  }

  return new Intl.DateTimeFormat(language.code, { month: 'short', day: 'numeric' }).format(date);
};

export default {
  I18nProvider,
  useTranslation,
  LANGUAGES,
  formatDate,
  formatNumber,
  formatLength,
  formatCurrency,
  formatRelativeTime
};
