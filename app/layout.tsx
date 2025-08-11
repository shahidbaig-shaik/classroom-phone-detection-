import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Concept Composition Framework',
  description: 'A concept-driven application framework',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
