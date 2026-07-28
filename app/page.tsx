"use client"

import Link from "next/link"
import { AfLogo } from "@/components/autoflow/af-logo"
import { useAuth } from "@/lib/auth-context"
import { QrCode, BarChart3, MessageCircle, ChevronRight, ArrowRight, LogOut } from "lucide-react"

const OZELLIKLER = [
  { icon: QrCode, baslik: "Saniyeler İçinde QR", aciklama: "Araç ekleyin, QR kodunuzu anında indirin. Müşteriler okutup tüm bilgilere ulaşsın.", renk: "from-af-accent to-af-accent-active", glow: "shadow-af-accent/25" },
  { icon: BarChart3, baslik: "Anlık Analitik", aciklama: "Hangi araç kaç kez okutuldu? WhatsApp dönüşüm oranınız nedir?", renk: "from-[#D4AF37] to-[#b8962f]", glow: "shadow-[#D4AF37]/25" },
  { icon: MessageCircle, baslik: "WhatsApp Entegrasyonu", aciklama: "Müşteri tek tuşla araçla ilgili mesaj atar. Satışa dönüşüm oranlarınız uçar.", renk: "from-af-success to-[#16a34a]", glow: "shadow-af-success/25" },
]

const ADIMLAR = [
  { sayi: "01", baslik: "Aracınızı Ekleyin", aciklama: "Fotoğraf, özellik ve fiyat bilgilerini girin" },
  { sayi: "02", baslik: "QR Kodu İndirin", aciklama: "Yüksek çözünürlüklü QR'ı indirin, araç camına yapıştırın" },
  { sayi: "03", baslik: "Müşteriler Okusun", aciklama: "Herhangi bir uygulama gerekmeden tüm bilgilere ulaşsınlar" },
]

export default function LandingPage() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-af-bg text-af-text overflow-hidden">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-af-bg/85 backdrop-blur-xl border-b border-af-border">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/"><AfLogo variant="sidebar" /></Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/panel"
                  className="bg-af-accent hover:bg-af-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Panele Git
                </Link>
                <button
                  onClick={signOut}
                  className="flex items-center gap-1.5 text-af-text-disabled hover:text-af-text text-sm transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:block">Çıkış</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/giris"
                  className="text-af-text-secondary hover:text-af-text text-sm font-medium px-4 py-2 rounded-xl border border-af-border hover:border-af-border-light transition-all"
                >
                  Oturum Aç
                </Link>
                <Link
                  href="/kayit"
                  className="bg-af-accent hover:bg-af-accent-hover text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Kayıt Ol
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-af-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 text-center max-w-4xl mx-auto px-5">
          <div className="inline-flex items-center gap-2 bg-af-accent/10 border border-af-accent/25 text-af-accent text-sm px-4 py-1.5 rounded-full mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-af-accent animate-pulse" />
            Galerinizi dijitalleştirin
          </div>
          <div className="flex justify-center mb-8">
            <AfLogo variant="full" size={80} />
          </div>
          <h1 className="text-4xl sm:text-6xl font-black leading-[1.05] mb-6">
            Araçlarınızı <span className="text-af-accent">QR ile</span> Dijitalleştirin
          </h1>
          <p className="text-af-text-secondary text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Müşterileriniz araç camındaki QR'ı okutun,{" "}
            <strong className="text-af-text">tüm bilgilere anında ulaşsınlar.</strong>{" "}
            WhatsApp'a direkt yönlendirin, satışları hızlandırın.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={user ? "/panel" : "/kayit"}
              className="flex items-center justify-center gap-2 bg-af-accent hover:bg-af-accent-hover text-white font-bold px-8 py-4 rounded-2xl transition-all hover:shadow-2xl hover:shadow-af-accent/30 text-base"
            >
              {user ? "Panele Git" : "Ücretsiz Başla"} <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section className="py-20 px-5 bg-af-surface/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black mb-3">3 Adımda Hazır</h2>
            <p className="text-af-text-secondary">Kurulum için saatten fazla süre gerekmez</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ADIMLAR.map((adim, i) => (
              <div key={adim.sayi} className="relative">
                <div className="bg-af-surface border border-af-border rounded-2xl p-6 h-full hover:border-af-accent/30 transition-colors">
                  <span className="text-6xl font-black text-af-accent/20 leading-none block mb-4">{adim.sayi}</span>
                  <h3 className="font-bold text-af-text text-lg mb-2">{adim.baslik}</h3>
                  <p className="text-af-text-secondary text-sm leading-relaxed">{adim.aciklama}</p>
                </div>
                {i < ADIMLAR.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 z-10 text-af-border">
                    <ChevronRight className="w-6 h-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ÖZELLİKLER */}
      <section className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black mb-3">Her Şey Dahil</h2>
            <p className="text-af-text-secondary">Galeri sahiplerinin ihtiyacı olan tüm araçlar</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {OZELLIKLER.map((oz) => (
              <div key={oz.baslik} className="group bg-af-surface border border-af-border rounded-2xl p-6 h-full hover:border-af-accent/30 transition-colors">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${oz.renk} flex items-center justify-center mb-4 shadow-xl ${oz.glow} group-hover:scale-110 transition-transform`}>
                  <oz.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-af-text text-lg mb-2">{oz.baslik}</h3>
                <p className="text-af-text-secondary text-sm leading-relaxed">{oz.aciklama}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-af-accent/5 via-af-accent/10 to-af-accent/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-af-accent/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl font-black mb-4">Galerinizi Hemen<br /><span className="text-af-accent">Dijitalleştirin</span></h2>
          <p className="text-af-text-secondary mb-8">İlk 5 araç tamamen ücretsiz. Kredi kartı gerekmez.</p>
          <Link
            href={user ? "/panel" : "/kayit"}
            className="inline-flex items-center gap-2 bg-af-accent hover:bg-af-accent-hover text-white font-bold px-10 py-4 rounded-2xl transition-all hover:shadow-2xl hover:shadow-af-accent/30 text-lg"
          >
            {user ? "Panele Git" : "Ücretsiz Başla"} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-af-border py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <AfLogo variant="sidebar" size={28} />
          <p className="text-af-text-disabled text-sm">© 2026 AutoFlow. Araç satış galerilerine özel QR sistemi.</p>
          <div className="flex gap-4">
            <Link href={user ? "/panel" : "/giris"} className="text-af-text-disabled hover:text-af-text text-sm transition-colors">{user ? "Panel" : "Giriş Yap"}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
