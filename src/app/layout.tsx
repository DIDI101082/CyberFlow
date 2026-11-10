import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Accusys CyberFlow',
  description: 'Gestión inteligente de proyectos con IA',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
