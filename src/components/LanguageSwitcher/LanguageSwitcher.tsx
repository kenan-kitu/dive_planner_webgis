import { useLanguage } from '../../i18n/LanguageContext'
import type { Language } from '../../i18n/translations'

const LANGUAGE_OPTIONS: Language[] = ['en', 'tr']

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="language-switcher" aria-label={t.language.label}>
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option}
          type="button"
          className={language === option ? 'is-active' : undefined}
          aria-pressed={language === option}
          aria-label={
            option === 'en' ? t.language.english : t.language.turkish
          }
          onClick={() => setLanguage(option)}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
