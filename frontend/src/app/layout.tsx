import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { MonitoringInitializer } from '@/components/MonitoringInitializer'

export const metadata: Metadata = {
  title: 'Cyber Container Platform',
  description: 'A modern, self-hosted container management platform',
  keywords: ['docker', 'containers', 'self-hosted', 'management', 'orchestration'],
  authors: [{ name: 'Cyber Container Platform' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <MonitoringInitializer />
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
