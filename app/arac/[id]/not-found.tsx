import Link from "next/link"
import { Car, ArrowLeft } from "lucide-react"

export default function AracNotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-6">
          <Car className="w-10 h-10 text-slate-400" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Araç Bulunamadı</h1>
        <p className="text-slate-500 mb-8">
          Aradığınız araç mevcut değil veya kaldırılmış olabilir. QR kodun hâlâ geçerli olduğundan emin olun.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-2xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Ana Sayfaya Dön
        </Link>
      </div>
    </div>
  )
}
