import { Metadata } from 'next'

export const metadata: Metadata = {
  title: {
    default: 'Contribly - Contribution Management',
    template: '%s | Contribly'
  },
  description: 'Manage contributions, payments, and claims for your organization',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  )
}
