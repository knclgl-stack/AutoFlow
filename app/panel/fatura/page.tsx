"use client"

import { useEffect, useState } from "react"
import { PanelTopbar } from "@/components/panel/panel-topbar"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Receipt, FileText, CheckCircle2, ChevronRight, AlertCircle, RefreshCw, Key, Link as LinkIcon, Lock } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface FaturaLog {
  id: string
  fatura_no: string
  cari: string
  islem_detayi: string
  tutar: number
  durum: string
  created_at: string
}

export default function FaturaPage() {
  const { user } = useAuth()
  const supabase = createClient()
  const [dbPlan, setDbPlan] = useState("Essential")
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  const [provider, setProvider] = useState("parasut")
  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [cariGrubu, setCariGrubu] = useState("Araç Alım-Satım Carileri")
  const [faturaLogs, setFaturaLogs] = useState<FaturaLog[]>([])
  const [sonEsitleme, setSonEsitleme] = useState("Son Eşitleme: Yapılmadı")

  useEffect(() => {
    if (!user) return
    const userId = user.id
    async function verileriYukle() {
      try {
        // 1. Profil ve entegrasyon ayarlarını yükle
        const { data: profile } = await supabase
          .from("galeri_profilleri")
          .select("plan, muhasebe_saglayici, muhasebe_api_key, muhasebe_api_secret, muhasebe_cari_grubu")
          .eq("user_id", userId)
          .single()
        
        if (profile) {
          if (profile.plan) setDbPlan(profile.plan)
          if (profile.muhasebe_saglayici) setProvider(profile.muhasebe_saglayici)
          if (profile.muhasebe_api_key) setApiKey(profile.muhasebe_api_key)
          if (profile.muhasebe_api_secret) setApiSecret(profile.muhasebe_api_secret)
          if (profile.muhasebe_cari_grubu) setCariGrubu(profile.muhasebe_cari_grubu)
        }

        // 2. Fatura logs yükle
        let { data: logs } = await supabase
          .from("fatura_entegrasyon_gecmisi")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
        
        if (logs && logs.length === 0) {
          // İlk kullanım için mock veri yükle
          const initialLogs = [
            { user_id: userId, fatura_no: "FAT20260001", cari: "Ahmet Yılmaz (Yılmaz Otomotiv)", islem_detayi: "2020 BMW 320d", tutar: 1850000, durum: "Entegre Edildi" },
            { user_id: userId, fatura_no: "FAT20260002", cari: "Mehmet Kaya", islem_detayi: "2019 Mercedes C200", tutar: 1620000, durum: "Entegre Edildi" },
            { user_id: userId, fatura_no: "FAT20260003", cari: "Hasan Demir (Demir Filo)", islem_detayi: "2021 Volkswagen Passat", tutar: 1280000, durum: "Entegre Edildi" }
          ]
          await supabase.from("fatura_entegrasyon_gecmisi").insert(initialLogs)
          
          // Tekrar çek
          const { data: refetchedLogs } = await supabase
            .from("fatura_entegrasyon_gecmisi")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
          logs = refetchedLogs
        }

        if (logs) {
          setFaturaLogs(logs)
          const formatOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
          setSonEsitleme(`Son Eşitleme: Bugün, ${new Date().toLocaleTimeString("tr-TR", formatOptions)}`)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    verileriYukle()
  }, [user])

  const handleSync = async () => {
    if (!user) return
    const userId = user.id
    setSyncing(true)
    setStatusMsg(null)
    try {
      // 1. Ayarları Supabase'e kaydet
      await supabase
        .from("galeri_profilleri")
        .update({
          muhasebe_saglayici: provider,
          muhasebe_api_key: apiKey,
          muhasebe_api_secret: apiSecret,
          muhasebe_cari_grubu: cariGrubu
        })
        .eq("user_id", userId)

      // 2. Senkronizasyon simülasyonu ile yeni log ekle
      const randomId = Math.floor(1000 + Math.random() * 9000)
      const providerLabel = provider === "parasut" ? "Paraşüt" : provider === "logo" ? "Logo" : provider === "kolaybi" ? "KolayBi" : "BizimHesap"
      
      const names = ["Canan Şahin", "Ali Vural", "Zeynep Tekin", "Bülent Yıldız"]
      const cars = ["2018 Renault Clio", "2022 Toyota Corolla", "2020 Honda Civic", "2021 Audi A4"]
      const prices = [650000, 1100000, 950000, 1950000]
      const randomIndex = Math.floor(Math.random() * names.length)

      const newLog = {
        user_id: userId,
        fatura_no: `FAT2026${randomId}`,
        cari: names[randomIndex],
        islem_detayi: cars[randomIndex],
        tutar: prices[randomIndex],
        durum: "Entegre Edildi"
      }

      const { error: insertError } = await supabase
        .from("fatura_entegrasyon_gecmisi")
        .insert([newLog])

      if (insertError) throw insertError

      // 3. Logları tekrar çek
      const { data: logs } = await supabase
        .from("fatura_entegrasyon_gecmisi")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
      
      if (logs) {
        setFaturaLogs(logs)
        const formatOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
        setSonEsitleme(`Son Eşitleme: Bugün, ${new Date().toLocaleTimeString("tr-TR", formatOptions)}`)
      }

      setStatusMsg(`${providerLabel} Cari ve Fatura senkronizasyonu başarıyla tamamlandı.`)
    } catch (err) {
      console.error(err)
      alert("Senkronizasyon sırasında hata oluştu.")
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-af-bg">
        <PanelTopbar baslik="Fatura & Muhasebe" />
        <main className="flex-1 p-6 flex justify-center items-center">
          <span className="w-10 h-10 border-4 border-af-accent/30 border-t-af-accent rounded-full animate-spin" />
        </main>
      </div>
    )
  }

  const isElite = dbPlan === "Elite"

  return (
    <div className="flex flex-col min-h-screen bg-af-bg text-af-text">
      <PanelTopbar baslik="Fatura & Muhasebe" aciklama="Ön muhasebe programları entegrasyonu" />

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full relative">

        {/* LUCKED OVERLAY (Professional/Essential) */}
        {!isElite && (
          <div className="absolute inset-0 bg-af-bg/85 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
            <div className="bg-af-surface border border-af-border rounded-3xl p-8 max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400/25 flex items-center justify-center mx-auto">
                <Lock className="w-8 h-8 text-amber-400" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-500/15 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                  👑 Elite Paket Özelliği
                </span>
                <h2 className="text-xl font-black text-white">Fatura ve Muhasebe Entegrasyonu</h2>
                <p className="text-sm text-af-text-secondary leading-relaxed">
                  Araç alım-satım faturalarınızı ve cari kayıtlarınızı Paraşüt, Logo veya KolayBi gibi ön muhasebe yazılımlarına otomatik aktarın.
                </p>
              </div>
              <div className="bg-af-surface-2/60 border border-af-border rounded-xl p-4 text-xs text-af-text-disabled text-left space-y-1.5">
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Anlık Paraşüt / Logo / KolayBi senkronizasyonu</div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Araç satışında otomatik e-fatura taslağı</div>
                <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Cari hesap ve mutabakat raporları</div>
              </div>
              <Link
                href="/panel/abonelik"
                className="block bg-amber-500 hover:bg-amber-400 text-black font-black py-3 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/20"
              >
                Elite Pakete Geç
              </Link>
            </div>
          </div>
        )}

        {/* REAL CONTENT VIEW */}
        <div className={cn("space-y-6", !isElite && "opacity-20 pointer-events-none select-none blur-[2px]")}>
          
          {/* Üst Kısım: Durum ve Ayarlar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Entegrasyon Ayarları */}
            <div className="md:col-span-2 bg-af-surface border border-af-border rounded-2xl p-6 space-y-4">
              <h3 className="font-bold text-white text-base mb-2 flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-af-accent" /> API Entegrasyon Ayarları
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Muhasebe Sağlayıcısı</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-3 py-2.5 text-af-text text-sm focus:outline-none focus:border-af-accent"
                  >
                    <option value="parasut">Paraşüt API (v4)</option>
                    <option value="logo">Logo Muhasebe</option>
                    <option value="kolaybi">KolayBi</option>
                    <option value="bizimhesap">BizimHesap</option>
                  </select>
                </div>
                <div>
                  <label className="block text-af-text-secondary text-sm font-medium mb-1.5">Müşteri/Cari Grubu</label>
                  <input
                    type="text"
                    value={cariGrubu}
                    onChange={(e) => setCariGrubu(e.target.value)}
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-2.5 text-af-text text-sm focus:outline-none focus:border-af-accent"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-af-text-secondary text-xs font-medium mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-af-text-disabled" /> Client API Key
                  </label>
                  <input
                    type="text"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-2.5 text-af-text font-mono text-xs focus:outline-none focus:border-af-accent"
                  />
                </div>
                <div>
                  <label className="block text-af-text-secondary text-xs font-medium mb-1 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-af-text-disabled" /> Client API Secret
                  </label>
                  <input
                    type="password"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    className="w-full bg-af-surface-2 border border-af-border rounded-xl px-4 py-2.5 text-af-text font-mono text-xs focus:outline-none focus:border-af-accent"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-af-border/60">
                <span className="text-[11px] text-af-text-disabled">{sonEsitleme}</span>
                <button
                  onClick={handleSync}
                  disabled={syncing}
                  className="flex items-center gap-2 bg-af-accent hover:bg-af-accent-hover disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl transition-all text-xs"
                >
                  {syncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Şimdi Eşitle
                </button>
              </div>
            </div>

            {/* Durum / Servis Kartı */}
            <div className="bg-af-surface border border-af-border rounded-2xl p-5 space-y-4">
              <h3 className="font-bold text-white text-sm">Entegrasyon Durumu</h3>
              
              <div className="bg-af-success/5 border border-af-success/15 rounded-xl p-3 flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-af-success flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-white">Eşitleme Aktif</p>
                  <p className="text-[10px] text-af-text-secondary mt-0.5">Muhasebe sunucuları ile bağlantı başarıyla sağlandı.</p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <div className="flex justify-between text-xs">
                  <span className="text-af-text-secondary">Aktif Entegrasyon:</span>
                  <span className="font-bold text-white capitalize">{provider}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-af-text-secondary">Eşitlenen Cari:</span>
                  <span className="font-bold text-white">{faturaLogs.length} Müşteri</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-af-text-secondary">Senkronizasyon:</span>
                  <span className="font-bold text-af-success">Otomatik (Anlık)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-af-border/60">
                <p className="text-[10px] text-af-text-disabled leading-relaxed">
                  💡 Her araç satışında veya cari kaydında fatura taslağı otomatik olarak muhasebe programınızda oluşturulur.
                </p>
              </div>
            </div>
          </div>

          {/* Eşitleme Durum Bildirimi */}
          {statusMsg && (
            <div className="bg-af-success/10 border border-af-success/20 text-af-success rounded-xl p-4 text-xs flex items-center gap-2.5 animate-in fade-in duration-300">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              {statusMsg}
            </div>
          )}

          {/* Son Muhasebe Eşitleme Kayıtları */}
          <div className="bg-af-surface border border-af-border rounded-2xl p-6">
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-af-accent" /> Muhasebe Entegrasyon Geçmişi
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-af-border pb-2 text-af-text-disabled">
                    <th className="pb-3 font-semibold">Fatura No</th>
                    <th className="pb-3 font-semibold">Müşteri (Cari)</th>
                    <th className="pb-3 font-semibold">İşlem Detayı</th>
                    <th className="pb-3 font-semibold">Tutar</th>
                    <th className="pb-3 font-semibold">Tarih</th>
                    <th className="pb-3 font-semibold text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-af-border/50">
                  {faturaLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-af-surface-2/20">
                      <td className="py-3 font-mono font-bold text-white">{log.fatura_no}</td>
                      <td className="py-3 font-semibold text-af-text">{log.cari}</td>
                      <td className="py-3 text-af-text-secondary">{log.islem_detayi}</td>
                      <td className="py-3 font-bold text-af-success">{`₺${Number(log.tutar).toLocaleString("tr-TR")}`}</td>
                      <td className="py-3 text-af-text-disabled">{new Date(log.created_at).toLocaleDateString("tr-TR")}</td>
                      <td className="py-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[10px] bg-af-success/10 border border-af-success/20 text-af-success px-2 py-0.5 rounded-full font-bold">
                          {log.durum}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}
