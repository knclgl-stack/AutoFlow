import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { AfLogo } from "@/components/autoflow/af-logo"

interface PublicPageShellProps {
  eyebrow: string
  title: string
  description: string
  icon: ReactNode
  children: ReactNode
  wide?: boolean
}

export function PublicPageShell({
  eyebrow,
  title,
  description,
  icon,
  children,
  wide = false,
}: PublicPageShellProps) {
  return (
    <div className="min-h-screen bg-af-bg text-af-text">
      <header className="sticky top-0 z-30 border-b border-af-border bg-af-bg/95 px-5 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="block overflow-hidden" aria-label="AutoFlow ana sayfa">
            <AfLogo variant="sidebar" size={30} />
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-af-text-secondary sm:flex">
            <Link href="/demo" className="transition-colors hover:text-white">Canlı Demo</Link>
            <Link href="/#fiyatlar" className="transition-colors hover:text-white">Fiyatlar</Link>
            <Link href="/iletisim" className="transition-colors hover:text-white">İletişim</Link>
          </nav>
          <Link
            href="/kayit"
            className="rounded-xl bg-af-accent px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-af-accent-hover"
          >
            Ücretsiz Başla
          </Link>
        </div>
      </header>

      <main className={`mx-auto px-5 py-12 sm:py-16 ${wide ? "max-w-6xl" : "max-w-4xl"}`}>
        <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-af-text-secondary transition-colors hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Ana sayfaya dön
        </Link>

        <div className="mb-10 flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-af-accent/20 bg-af-accent/10 text-af-accent">
            {icon}
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-af-accent">{eyebrow}</p>
            <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-af-text-secondary sm:text-base">{description}</p>
          </div>
        </div>

        {children}
      </main>

      <footer className="border-t border-af-border px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-af-text-disabled sm:flex-row">
          <p>© 2026 AutoFlow · AI destekli dijital araç vitrini</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/gizlilik" className="hover:text-white">Gizlilik ve KVKK</Link>
            <Link href="/kullanim-kosullari" className="hover:text-white">Kullanım Koşulları</Link>
            <Link href="/cerez-politikasi" className="hover:text-white">Çerez Politikası</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
