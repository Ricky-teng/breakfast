import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import zh from '../translations/zh.json'
import en from '../translations/en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-TW': { translation: zh },
      'en': { translation: en }
    },
    fallbackLng: 'zh-TW',
    interpolation: { escapeValue: false }
  })

export default i18n
