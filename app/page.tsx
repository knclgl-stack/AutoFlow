"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AfLogo } from "@/components/autoflow/af-logo"
import { useAuth } from "@/lib/auth-context"
import {
  QrCode, BarChart3, MessageCircle, ArrowRight, LogOut,
  CheckCircle, ChevronRight, Clock, Shield,
  Zap, Sparkles, Car, Camera, Lock, ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"

const ISTATISTIKLER = [
  { sayi: "3", etiket: "Essentials Araç Kotası", icon: Car },
  { sayi: "150", etiket: "Professional AI / Ay", icon: Sparkles },
  { sayi: "500", etiket: "Elite AI / Ay", icon: Zap },
  { sayi: "7/24", etiket: "Dijital Vitrin", icon: Clock },
]

const SENARYOLAR = [
  {
    baslik: "Vitrindeki araç",
    aciklama: "Müşteri QR kodu okutarak aracın yayınlanan bilgilerine, fotoğraflarına ve WhatsApp iletişim düğmesine ulaşır.",
    icon: QrCode,
  },
  {
    baslik: "Uzaktan inceleme",
    aciklama: "Paylaşılabilir galeri sayfası; aktif ve satılmış araçları, galeri telefonunu ve adresini tek yerde gösterir.",
    icon: Camera,
  },
  {
    baslik: "Özel yönetim paneli",
    aciklama: "Araç yönetimi, QR görüntülenmeleri ve WhatsApp tıklamaları yalnızca yetkili galeri hesabında kalır.",
    icon: BarChart3,
  },
]

/* Özellikler - Özellik değil FAYDA odaklı (Benefit-Driven Copy) */
const FAYDALAR = [
  {
    icon: QrCode,
    baslik: "Saniyeler İçinde Bağlantı",
    faydaMetni: "Müşteri QR'ı okutunca telefonu zaten elinde — uygulama indirmeden, internet aramadan tüm araç bilgisine ulaşır.",
    renk: "from-violet-500 to-af-accent",
    glow: "shadow-violet-500/20",
    detay: "Uygulama indirmek gerekmez"
  },
  {
    icon: BarChart3,
    baslik: "Hangi Araç Daha Çok İlgi Çekiyor?",
    faydaMetni: "Gerçek zamanlı analitikle hangi aracınızın kaç kez görüntülendiğini, WhatsApp tıklamalarını ve ziyaretçi lokasyonlarını görün.",
    renk: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/20",
    detay: "Görüntülenme ve WhatsApp tıklamaları"
  },
  {
    icon: MessageCircle,
    baslik: "WhatsApp'a Direkt Akış",
    faydaMetni: "\"Bu araçla ilgileniyorum\" butonu müşteriyi araç bilgisi eklenmiş hazır mesajla WhatsApp'a yönlendirir.",
    renk: "from-emerald-500 to-green-600",
    glow: "shadow-emerald-500/20",
    detay: "Hazır araç mesajı"
  },
  {
    icon: Camera,
    baslik: "AI Fotoğraf Stüdyosu",
    faydaMetni: "Telefonla çekilen kötü fotoğrafları yapay zeka ile profesyonel showroom kalitesine yükseltin. Aracın rengiyle uyumlu stüdyo otomatik seçilir.",
    renk: "from-pink-500 to-rose-600",
    glow: "shadow-pink-500/20",
    detay: "Siyah, beyaz, mavi, kırmızı için özel stüdyo"
  },
  {
    icon: Shield,
    baslik: "Galeri Sayfanız, Markanız",
    faydaMetni: "Kendi galeri profilinizi oluşturun. Müşteriler sizi Google'da arayabilir, doğrudan araç kataloğunuzu görebilir.",
    renk: "from-sky-500 to-blue-600",
    glow: "shadow-sky-500/20",
    detay: "Paylaşılabilir galeri bağlantısı"
  },
  {
    icon: Zap,
    baslik: "Kolay Kurulum",
    faydaMetni: "Teknik bilgi gerekmez. Hesap açın, aracınızı ekleyin ve araca özel QR kodunu indirin.",
    renk: "from-yellow-400 to-amber-500",
    glow: "shadow-yellow-400/20",
    detay: "Kredi kartı gerektirmez"
  },
]

/* Karşılaştırma - Anchoring & Loss Aversion */
const KARSILASTIRMA = [
  { ozellik: "Araç bilgi sayfası", eski: false, yeni: true },
  { ozellik: "QR kod ile anında erişim", eski: false, yeni: true },
  { ozellik: "WhatsApp entegrasyonu", eski: false, yeni: true },
  { ozellik: "Anlık görüntülenme analitiki", eski: false, yeni: true },
  { ozellik: "AI fotoğraf stüdyosu", eski: false, yeni: true },
  { ozellik: "Araç bilgisine erişim", eski: "Personele bağlı", yeni: "QR ile 7/24" },
  { ozellik: "Dijital vitrin", eski: "Harici platforma bağlı", yeni: "Kendi galeri sayfanız" },
]

/* SSS - Objection Handling (İtiraz Karşılama) */
const SSS = [
  { soru: "Teknik bilgim yok, kurabilir miyim?", cevap: "Evet. Hesabınızı oluşturduktan sonra araç bilgilerini girip fotoğrafları yüklersiniz; sistem araca özel QR kodunu oluşturur." },
  { soru: "Müşteri telefona bir şey indirmek zorunda mı?", cevap: "Hayır. Modern akıllı telefonlar QR kodu nativeli okur. Herhangi bir uygulama indirmeden, sadece kamerasını açıp taramaları yeterli." },
  { soru: "Fotoğraflarım iyi değilse ne olur?", cevap: "Flow AI Stüdyo özelliğimiz aracınızın fotoğrafını analiz edip rengine özel profesyonel stüdyo ortamına yerleştirir. Garaj köşesindeki fotoğraf showroom kalitesine dönüşür." },
  { soru: "Araç ve analiz bilgilerimi kimler görür?", cevap: "Aktif ve satılmış araçların yayınlanan bilgileri galeri sayfanızda görünür. Pasif araçlar, gizlenen fiyatlar ve analiz verileri yalnızca yetkili hesabınızda kalır." },
  { soru: "Zaten Sahibinden / Arabam.com kullanıyorum, AutoFlow'a ne gerek var?", cevap: "AutoFlow, online ilan platformlarının bir rakibi değil; aksine fiziksel showroomunuzdaki satış temsilcinizdir. İlan siteleri uzaktaki alıcıları çekerken, AutoFlow galerinizin önüne gelen, vitrindeki arabayı süzüp camdaki QR kodu okutan sıcak müşterilerinize anında tüm detayları sunar. Böylece kapıdaki müşteriyi kaçırmaz, araç başına fahiş ilan ücretleri ödemek yerine kendi web sitenizde sınırsız katalog sergilersiniz." },
  { soru: "Ücretli plana geçmeden deneyebilir miyim?", cevap: "Evet. Ücretsiz Essentials planında 3 araç ekleyebilir, QR kodları oluşturabilir, galeri sayfanızı kullanabilirsiniz. Kredi kartı bilgisi istenmez." },
]

/* SSS Item */
function SSSItem({ soru, cevap }: { soru: string; cevap: string }) {
  const [acik, setAcik] = useState(false)
  return (
    <div className="border border-af-border rounded-2xl overflow-hidden transition-all">
      <button
        onClick={() => setAcik(!acik)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-af-surface-2/30 transition-colors"
      >
        <span className="font-semibold text-white text-sm pr-4">{soru}</span>
        <ChevronDown className={cn("w-5 h-5 text-af-text-disabled flex-shrink-0 transition-transform duration-300", acik && "rotate-180")} />
      </button>
      {acik && (
        <div className="px-5 pb-5 text-sm text-af-text-secondary leading-relaxed border-t border-af-border pt-4">
          {cevap}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   ANA COMPONENT
───────────────────────────────────────────── */
export default function LandingPage() {
  const { user, signOut } = useAuth()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", fn, { passive: true })
    return () => window.removeEventListener("scroll", fn)
  }, [])

  const ctaHref = user ? "/panel" : "/kayit"
  const ctaText = user ? "Panele Git" : "Ücretsiz Başla"

  return (
    <div className="min-h-screen bg-af-bg text-af-text overflow-x-hidden">

      {/* ══════════════════════ NAVBAR ══════════════════════ */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-af-bg/95 backdrop-blur-xl border-b border-af-border shadow-xl shadow-black/20"
          : "bg-transparent"
      )}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="block overflow-hidden">
            <AfLogo variant="sidebar" size={42} />
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm text-af-text-secondary">
            <a href="#ozellikler" className="hover:text-white transition-colors">Özellikler</a>
            <a href="#fiyatlar" className="hover:text-white transition-colors">Fiyatlar</a>
            <a href="#senaryolar" className="hover:text-white transition-colors">Kullanım</a>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link href="/panel" className="bg-af-accent hover:bg-af-accent-hover text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-af-accent/20">
                  Panele Git
                </Link>
                <button onClick={signOut} className="flex items-center gap-1.5 text-af-text-disabled hover:text-af-text text-sm transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/giris" className="text-af-text-secondary hover:text-white text-sm font-medium px-3 py-2 transition-colors hidden sm:block">
                  Giriş Yap
                </Link>
                <Link href="/kayit" className="bg-af-accent hover:bg-af-accent-hover text-white text-sm font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-af-accent/20 hover:shadow-af-accent/30">
                  Ücretsiz Başla →
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ══════════════════════ HERO ══════════════════════
          Prensip: Loss Aversion + Clear Value Proposition
          + Social Proof Badge + Anchoring (ücretsiz)
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        {/* Arka plan efektleri */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-af-accent/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-violet-600/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-4xl mx-auto px-5 py-20">

          <div className="inline-flex items-center gap-2 bg-af-accent/10 border border-af-accent/25 text-af-accent text-sm px-4 py-2 rounded-full mb-8">
            <QrCode className="w-4 h-4" />
            <span className="font-semibold">Galeriler için QR destekli dijital vitrin</span>
          </div>

          {/* Ana başlık — Problem-Agitate-Solution (PAS) */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.05] mb-6 tracking-tight">
            Müşteriniz Arabayı Gördü,{" "}
            <span className="text-af-accent">Bilgiye Ulaşamadı</span>{" "}
            ve Gitti.
          </h1>

          {/* Acı noktası */}
          <p className="text-af-text-secondary text-lg sm:text-xl max-w-2xl mx-auto mb-4 leading-relaxed">
            AutoFlow QR ile müşteriniz uygulama indirmeden yayınladığınız araç bilgilerine ulaşır ve WhatsApp üzerinden sizinle iletişim kurar.
          </p>

          {/* Değer önerisi özeti */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {["Uygulama indirmez", "Kolay kurulum", "Kredi kartı yok", "3 araç ücretsiz"].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs font-semibold text-af-text-secondary bg-af-surface border border-af-border px-3 py-1.5 rounded-full">
                <CheckCircle className="w-3.5 h-3.5 text-af-success" /> {t}
              </span>
            ))}
          </div>

          {/* CTA Butonları — Urgency + Loss Aversion */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={ctaHref}
              className="group flex items-center gap-2.5 bg-af-accent hover:bg-af-accent-hover text-white font-black px-10 py-4.5 rounded-2xl transition-all hover:shadow-2xl hover:shadow-af-accent/40 text-lg"
            >
              {ctaText}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#nasil-calisir"
              className="flex items-center gap-2 text-af-text-secondary hover:text-white text-sm font-semibold transition-colors"
            >
              Nasıl çalışır?
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Micro-text: Güven artırıcı */}
          <p className="text-xs text-af-text-disabled mt-4">
            🔒 Gizliliğiniz korunur · SSL şifreli · Türk galerilerine özel
          </p>
        </div>
      </section>

      {/* ══════════════════════ PLAN ÖZETİ ══════════════════════ */}
      <section className="py-14 px-5 border-y border-af-border bg-af-surface/30">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {ISTATISTIKLER.map((s) => {
            const Ic = s.icon
            return (
              <div key={s.etiket} className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="w-10 h-10 rounded-xl bg-af-accent/10 flex items-center justify-center">
                    <Ic className="w-5 h-5 text-af-accent" />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-black text-white">{s.sayi}</p>
                <p className="text-xs text-af-text-secondary mt-1">{s.etiket}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══════════════════════ PROBLEM → ÇÖZÜM ══════════════════════
          Prensip: Contrast Effect + Loss Aversion (Kaybettikleriniz)
      ══════════════════════════════════════════════════════════════ */}
      <section className="py-20 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs uppercase font-bold tracking-wider text-af-accent mb-3 block">Dijital Vitrin</span>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              Araç Bilgileri Her Zaman{" "}
              <span className="text-af-accent">Erişilebilir</span>
            </h2>
            <p className="text-af-text-secondary max-w-xl mx-auto text-sm leading-relaxed">
              AutoFlow, vitrindeki QR kodu ile araç bilgilerini, galeri iletişim bilgilerini ve WhatsApp bağlantısını tek sayfada birleştirir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Eski yöntem */}
            <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-6">
              <h3 className="font-bold text-red-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Eski Yöntem
              </h3>
              <ul className="space-y-3">
                {["Müşteri sorar, siz ararsınız — 15 dakika gider", "Fiyat listesi kağıtta, değiştiremezsiniz", "Hangi araç ilgi çekiyor? Bilmiyorsunuz", "Fotoğraf kalitesi satışı etkiler, düzeltemezsiniz", "Akşam gelen müşteri bilgiye ulaşamaz"].map(m => (
                  <li key={m} className="flex items-start gap-2.5 text-sm text-red-300/80">
                    <span className="w-4 h-4 rounded-full border border-red-500/40 flex items-center justify-center flex-shrink-0 mt-0.5 text-red-500 text-xs">✕</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            {/* AutoFlow */}
            <div className="bg-af-accent/5 border border-af-accent/20 rounded-2xl p-6">
              <h3 className="font-bold text-af-accent mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-af-accent animate-pulse" /> AutoFlow ile
              </h3>
              <ul className="space-y-3">
                {["Müşteri QR okutarak yayınlanan bilgilere ulaşır", "Fiyatı panelden güncelleyebilirsiniz", "Her araç için görüntülenme ve tıklama analitiği", "Uygun planlarda Flow AI fotoğraf araçları", "7/24 erişilebilen dijital galeri sayfası"].map(m => (
                  <li key={m} className="flex items-start gap-2.5 text-sm text-af-text">
                    <CheckCircle className="w-4 h-4 text-af-success flex-shrink-0 mt-0.5" />
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════ NASIL ÇALIŞIR ══════════════════════
          Prensip: Cognitive Ease (Kolay görün) + IKEA Effect
      ══════════════════════════════════════════════════════════════ */}
      <section id="nasil-calisir" className="py-20 px-5 bg-af-surface/30 border-y border-af-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase font-bold tracking-wider text-af-accent mb-3 block">Basitlik Güçtür</span>
            <h2 className="text-3xl sm:text-4xl font-black mb-3">3 Adımda Canlıya Alın</h2>
            <p className="text-af-text-secondary text-sm">Teknik bilgi gerekmez. Hesabınızı oluşturun, araç bilgilerini ekleyin ve QR kodunu indirin.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {[
              { n: "01", baslik: "Hesabınızı Açın", aciklama: "E-posta ile kaydolun. Kredi kartı bilgisi istenmez.", zaman: "Ücretsiz kayıt", icon: Zap },
              { n: "02", baslik: "Aracınızı Ekleyin", aciklama: "Fotoğraf yükleyin, özellikleri ve yayınlamak istediğiniz fiyatı girin.", zaman: "Panelden yönetim", icon: Car },
              { n: "03", baslik: "QR Kodunu Yayınlayın", aciklama: "QR kodunu indirin ve araç camında veya dijital kanallarınızda paylaşın.", zaman: "Araca özel QR", icon: QrCode },
            ].map((adim, i) => {
              const Ic = adim.icon
              return (
                <div key={adim.n} className="relative group">
                  <div className="bg-af-surface border border-af-border rounded-2xl p-7 h-full hover:border-af-accent/40 transition-all hover:-translate-y-1">
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-5xl font-black text-af-accent/15 leading-none">{adim.n}</span>
                      <div className="w-10 h-10 rounded-xl bg-af-accent/10 flex items-center justify-center">
                        <Ic className="w-5 h-5 text-af-accent" />
                      </div>
                    </div>
                    <h3 className="font-bold text-white text-base mb-2">{adim.baslik}</h3>
                    <p className="text-af-text-secondary text-sm leading-relaxed mb-4">{adim.aciklama}</p>
                    <span className="inline-flex items-center gap-1.5 text-xs text-af-accent font-semibold bg-af-accent/10 px-2.5 py-1 rounded-full">
                      <Clock className="w-3 h-3" /> {adim.zaman}
                    </span>
                  </div>
                  {i < 2 && <div className="hidden md:block absolute top-1/2 -right-3 z-10 text-af-border"><ChevronRight className="w-6 h-6" /></div>}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════ ÖZELLİKLER ══════════════════════
          Prensip: Feature → Benefit framing
      ══════════════════════════════════════════════════════════ */}
      <section id="ozellikler" className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase font-bold tracking-wider text-af-accent mb-3 block">Neden AutoFlow?</span>
            <h2 className="text-3xl sm:text-4xl font-black mb-3">Her Araç, Sizin İçin Çalışır</h2>
            <p className="text-af-text-secondary max-w-xl mx-auto text-sm">Galeriniz artık 24 saat müşteri karşılar — siz orada olsanız da olmasanız da.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FAYDALAR.map((f) => {
              const Ic = f.icon
              return (
                <div key={f.baslik} className="group bg-af-surface border border-af-border rounded-2xl p-6 hover:border-af-accent/30 transition-all hover:-translate-y-1">
                  <div className={cn("w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4 shadow-xl group-hover:scale-105 transition-transform", f.renk, f.glow)}>
                    <Ic className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-white text-base mb-2">{f.baslik}</h3>
                  <p className="text-af-text-secondary text-sm leading-relaxed mb-3">{f.faydaMetni}</p>
                  <span className="text-[11px] font-semibold text-af-accent bg-af-accent/10 px-2.5 py-1 rounded-full">{f.detay}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════ KULLANIM SENARYOLARI ══════════════════════ */}
      <section id="senaryolar" className="py-20 px-5 bg-af-surface/30 border-y border-af-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase font-bold tracking-wider text-af-accent mb-3 block">Nerede Kullanılır?</span>
            <h2 className="text-3xl font-black mb-2">Galeriden Panele Tek Akış</h2>
            <p className="text-sm text-af-text-secondary mt-3">Yayınlanan bilgiler müşteriye, yönetim ve analiz verileri yalnızca size görünür.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {SENARYOLAR.map((senaryo) => {
              const Icon = senaryo.icon
              return (
                <div key={senaryo.baslik} className="bg-af-surface border border-af-border rounded-2xl p-6">
                  <div className="w-11 h-11 rounded-xl bg-af-accent/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-af-accent" />
                  </div>
                  <h3 className="font-bold text-white mb-2">{senaryo.baslik}</h3>
                  <p className="text-af-text-secondary text-sm leading-relaxed">{senaryo.aciklama}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════ FİYATLANDIRMA ══════════════════════
          Prensip: Decoy Effect (orta plan vurgulama) + Anchoring
      ══════════════════════════════════════════════════════════════ */}
      <section id="fiyatlar" className="py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs uppercase font-bold tracking-wider text-af-accent mb-3 block">Şeffaf Fiyatlandırma</span>
            <h2 className="text-3xl sm:text-4xl font-black mb-3">Galerinizin Büyüklüğüne Göre Seçin</h2>
            <p className="text-af-text-secondary text-sm">Her plan kendi boyutundaki galeri için optimize edilmiştir. Sürprize yer yok.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { id: "essentials", ad: "Essentials", fiyat: "Ücretsiz", renk: "border-af-border", badge: null, araç: "3 araç", cta: "Hemen Başla", ctaClass: "bg-af-surface-2 hover:bg-af-border border border-af-border text-white" },
              { id: "professional", ad: "Professional", fiyat: "₺2.990", renk: "border-af-accent/60 ring-2 ring-af-accent/20", badge: "⭐ En Popüler", araç: "12 araç", cta: "Professional Seç", ctaClass: "bg-af-accent hover:bg-af-accent-hover text-white shadow-xl shadow-af-accent/25" },
              { id: "elite", ad: "Elite", fiyat: "₺4.990", renk: "border-amber-500/40", badge: "👑 Elit", araç: "Sınırsız araç", cta: "Elite Seç", ctaClass: "bg-amber-500 hover:bg-amber-400 text-black font-black shadow-xl shadow-amber-500/20" },
            ].map((p) => (
              <div key={p.id} className={cn("relative rounded-2xl border-2 bg-af-surface p-6 flex flex-col", p.renk)}>
                {p.badge && (
                  <div className={cn("absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full",
                    p.id === "professional" ? "bg-af-accent text-white" : "bg-amber-500 text-black"
                  )}>{p.badge}</div>
                )}
                <h3 className="font-black text-white text-lg mb-1">{p.ad}</h3>
                <div className="text-3xl font-black text-white mb-1">{p.fiyat}<span className="text-sm font-normal text-af-text-secondary">{p.fiyat !== "Ücretsiz" ? " /ay" : ""}</span></div>
                <p className="text-xs text-af-text-disabled mb-4">{p.araç}</p>
                <Link href={ctaHref} className={cn("w-full py-3 rounded-xl text-sm font-bold text-center transition-all mt-auto", p.ctaClass)}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-af-text-disabled mt-5">Ücretli plan talepleri havale bilgileriyle alınır ve yönetici onayından sonra aktive edilir.</p>
        </div>
      </section>

      {/* ══════════════════════ SSS ══════════════════════
          Prensip: Objection Handling — Satın almayı önleyen soruları cevapla
      ══════════════════════════════════════════════════ */}
      <section className="py-20 px-5 bg-af-surface/30 border-t border-af-border">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Aklınızdaki Sorular</h2>
            <p className="text-af-text-secondary text-sm">Başlamadan önce her şeyi netleştirin.</p>
          </div>
          <div className="space-y-3">
            {SSS.map((s) => <SSSItem key={s.soru} soru={s.soru} cevap={s.cevap} />)}
          </div>
        </div>
      </section>

      {/* ══════════════════════ SON CTA ══════════════════════
          Prensip: Urgency + FOMO + Clear CTA
      ══════════════════════════════════════════════════════ */}
      <section className="py-28 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-af-accent/10 via-transparent to-violet-600/8" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-af-accent/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-af-accent bg-af-accent/10 border border-af-accent/20 px-3 py-1.5 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Şimdi Başlayan Kazanır
          </span>
          <h2 className="text-4xl sm:text-5xl font-black mb-5 leading-tight">
            Yarın değil,{" "}
            <span className="text-af-accent">Bugün</span>{" "}
            Başlayın
          </h2>
          <p className="text-af-text-secondary mb-3 text-base max-w-lg mx-auto leading-relaxed">
            Essentials planıyla ilk 3 aracınızı ücretsiz yayınlayın; galeri sayfanızı ve araç QR kodlarını deneyin.
          </p>
          <p className="text-sm text-af-text-disabled mb-10">
            Kredi kartı gerekmez · Kayıt herkese açık · Ücretli planlar havale ile
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href={ctaHref}
              className="group flex items-center gap-3 bg-af-accent hover:bg-af-accent-hover text-white font-black px-10 py-5 rounded-2xl transition-all hover:shadow-2xl hover:shadow-af-accent/40 text-lg"
            >
              <Lock className="w-5 h-5" />
              {ctaText} — Ücretsiz
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-6">
            {["SSL Şifreli", "Erişim Kontrollü", "Türkçe Arayüz"].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs text-af-text-disabled">
                <Shield className="w-3 h-3 text-af-success" /> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════ FOOTER ══════════════════════ */}
      <footer className="border-t border-af-border py-10 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-6">
            <Link href="/" className="block overflow-hidden">
              <AfLogo variant="sidebar" size={28} />
            </Link>
            <div className="flex gap-6 text-sm text-af-text-disabled">
              <a href="#ozellikler" className="hover:text-white transition-colors">Özellikler</a>
              <a href="#fiyatlar" className="hover:text-white transition-colors">Fiyatlar</a>
              <a href="#senaryolar" className="hover:text-white transition-colors">Kullanım</a>
              <Link href="/giris" className="hover:text-white transition-colors">Giriş Yap</Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-6 border-t border-af-border">
            <p className="text-af-text-disabled text-xs">© 2026 AutoFlow · Araç satış galerilerine özel dijital çözümler</p>
            <p className="text-af-text-disabled text-xs">Türkiye'de üretildi 🇹🇷</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
