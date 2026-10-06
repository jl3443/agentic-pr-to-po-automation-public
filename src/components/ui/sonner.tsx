import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--background)',
          '--normal-text': 'var(--foreground)',
          '--normal-border': 'var(--border)',
          '--success-bg': 'var(--background)',
          '--success-text': 'oklch(0.45 0.15 145)',
          '--error-bg': 'var(--background)',
          '--error-text': 'oklch(0.577 0.245 27.325)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
