import { forwardRef, useId, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import type { Icon } from '@phosphor-icons/react'

/** Regular weight throughout. 16px controls, 20px navigation, 24px illustrations.
 * Icons are decorative; their parent control supplies its visible or aria label.
 * Do not use icon weight or color alone to communicate a state.
 */
export function PreviewIcon({ icon: Component, size = 'control' }: { icon: Icon; size?: 'control' | 'navigation' | 'illustration' }) {
  return <Component size={{ control: 16, navigation: 20, illustration: 24 }[size]} weight="regular" aria-hidden="true" className="pv-icon" />
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  return <button type="button" className={`pv-button pv-button--${variant} ${className}`} {...props} />
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'accent' | 'success'; children: ReactNode }) {
  return <span className={`pv-badge pv-badge--${tone}`}>{children}</span>
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className = '', ...props }, ref) {
  return <input ref={ref} className={`pv-input ${className}`} {...props} />
})

export function Panel({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`pv-panel ${className}`} {...props} />
}

export function Card({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`pv-card ${className}`} {...props} />
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="pv-page-container">{children}</div>
}

export function Tabs({ label, items, value, onChange, children }: {
  label: string
  items: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
  children: ReactNode
}) {
  const id = useId()
  return <>
    <div className="pv-tabs" role="tablist" aria-label={label}>
      {items.map((item, index) => <button
        key={item.id} id={`${id}-${item.id}`} type="button" role="tab"
        aria-selected={value === item.id} aria-controls={`${id}-panel`} tabIndex={value === item.id ? 0 : -1}
        onClick={() => onChange(item.id)}
        onKeyDown={event => {
          let target: number
          if (event.key === 'ArrowRight') target = (index + 1) % items.length
          else if (event.key === 'ArrowLeft') target = (index + items.length - 1) % items.length
          else if (event.key === 'Home') target = 0
          else if (event.key === 'End') target = items.length - 1
          else return
          event.preventDefault()
          onChange(items[target].id)
          document.getElementById(`${id}-${items[target].id}`)?.focus()
        }}
      >{item.label}</button>)}
    </div>
    <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-${value}`} tabIndex={0}>{children}</div>
  </>
}

export function Table({ children, label }: { children: ReactNode; label: string }) {
  return <div className="pv-table-scroll" role="region" aria-label={label} tabIndex={0}><table className="pv-table"><caption className="pv-sr-only">{label}</caption>{children}</table></div>
}
