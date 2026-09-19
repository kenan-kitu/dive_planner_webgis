import { useState, type ReactNode } from 'react'

interface SidebarSectionProps {
  title: string
  summary: string
  initiallyOpen?: boolean
  children: ReactNode
}

export function SidebarSection({
  title,
  summary,
  initiallyOpen = false,
  children,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen)

  return (
    <section className={`sidebar-section${isOpen ? ' is-open' : ''}`}>
      <button
        className="sidebar-section__toggle"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{title}</span>
        <strong>{summary}</strong>
        <span className="sidebar-section__chevron" aria-hidden="true">⌄</span>
      </button>
      <div className="sidebar-section__body" hidden={!isOpen}>
        {children}
      </div>
    </section>
  )
}
