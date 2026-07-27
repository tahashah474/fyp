import type { Metadata } from 'next'
import { Inter, Noto_Nastaliq_Urdu } from 'next/font/google'
import './globals.css'
import { I18nProvider } from '@/lib/i18n/context'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  variable: '--font-noto-nastaliq',
  display: 'swap',
  weight: ['400', '700'],
})

export const metadata: Metadata = {
  title: 'Malshifa — ملشفا | Livestock Health Platform',
  description: 'AI-assisted livestock health triage for Pakistani farmers. Connect with verified veterinary doctors.',
  keywords: ['livestock', 'veterinary', 'Pakistan', 'farmers', 'animal health', 'مویشی', 'جانوروں کی صحت'],
  openGraph: {
    title: 'Malshifa — ملشفا',
    description: 'AI-assisted livestock health for Pakistani farmers',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${notoNastaliqUrdu.variable}`}>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  )
}
