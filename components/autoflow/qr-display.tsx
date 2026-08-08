import { getQrImageUrl } from "@/lib/arac-helpers"
import { Download, ExternalLink, Printer } from "lucide-react"

interface QrDisplayProps {
  aracSlug: string
  aracAdi: string
  size?: number
  showDownload?: boolean
  showActions?: boolean
  galleryName?: string
}

export function QrDisplay({
  aracSlug,
  aracAdi,
  size = 200,
  showDownload = false,
  showActions = false,
  galleryName,
}: QrDisplayProps) {
  const qrUrl = `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/arac/${aracSlug}`
  const imgUrl = getQrImageUrl(qrUrl, size)

  const handleDownload = async () => {
    try {
      const response = await fetch(imgUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `QR_${aracSlug}.png`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      // Yeni sekmede aç (fallback)
      window.open(imgUrl, "_blank")
    }
  }

  const handleOpen = () => {
    window.open(qrUrl, "_blank")
  }

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>${aracAdi} QR Kod Kartı</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              text-align: center;
              padding: 40px;
              color: #1a1a1a;
              background-color: #fff;
            }
            .card {
              border: 4px solid #111;
              border-radius: 24px;
              padding: 40px 20px;
              max-width: 400px;
              margin: 0 auto;
              box-shadow: 0 10px 30px rgba(0,0,0,0.05);
            }
            .header {
              font-size: 26px;
              font-weight: 900;
              margin-bottom: 2px;
              color: #111;
              letter-spacing: -0.5px;
            }
            .sub {
              font-size: 11px;
              color: #666;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 30px;
            }
            .qr-container {
              display: inline-block;
              padding: 15px;
              border: 2px solid #eaeaea;
              border-radius: 20px;
              background: #fff;
              margin-bottom: 20px;
            }
            .qr-image {
              display: block;
            }
            .scan-text {
              font-size: 14px;
              font-weight: 800;
              color: #0066cc;
              background-color: #e6f0fa;
              display: inline-block;
              padding: 6px 16px;
              border-radius: 50px;
              margin-bottom: 25px;
            }
            .vehicle-details {
              border-top: 2px solid #f0f0f0;
              padding-top: 20px;
            }
            .vehicle-name {
              font-size: 20px;
              font-weight: 800;
              color: #111;
            }
            .footer-note {
              font-size: 10px;
              color: #888;
              margin-top: 10px;
              line-height: 1.4;
              padding: 0 10px;
            }
            @media print {
              body { padding: 0; }
              .card { box-shadow: none; border-color: #000; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">${galleryName || "AutoFlow"}</div>
            <div class="sub">${galleryName ? "Dijital Araç Kataloğu" : "Akıllı Oto Galeri Çözümü"}</div>
            <div class="scan-text">DETAYLAR İÇİN KAMERANIZLA TARATIN</div>
            <div>
              <div class="qr-container">
                <img class="qr-image" src="${imgUrl}" width="240" height="240" />
              </div>
            </div>
            <div class="vehicle-details">
              <div class="vehicle-name">${aracAdi}</div>
              <div class="footer-note">Fiyat, ekspertiz raporu, tramer geçmişi ve tüm detaylı donanım özelliklerine anında ulaşmak için kodu okutabilirsiniz.</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* QR Kod */}
      <div className="bg-white rounded-2xl p-3 shadow-lg border border-slate-200">
        <img
          src={imgUrl}
          alt={`${aracAdi} QR Kodu`}
          width={size}
          height={size}
          className="rounded-lg"
        />
      </div>

      {/* Araç adı */}
      <p className="text-xs text-slate-500 text-center max-w-[200px] leading-relaxed">
        {aracAdi}
      </p>

      {/* Aksiyonlar */}
      {(showDownload || showActions) && (
        <div className="flex gap-2">
          {showDownload && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <Download className="w-3.5 h-3.5" />
              İndir
            </button>
          )}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
            title="QR Kodu Yazdır"
          >
            <Printer className="w-3.5 h-3.5" />
            Yazdır
          </button>
          {showActions && (
            <button
              onClick={handleOpen}
              className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Sayfayı Gör
            </button>
          )}
        </div>
      )}
    </div>
  )
}
