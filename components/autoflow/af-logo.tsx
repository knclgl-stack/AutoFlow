import Image from "next/image"

interface AfLogoProps {
  variant?: "icon" | "full" | "sidebar"
  className?: string
  size?: number
}

export function AfLogo({ variant = "full", className = "", size = 40 }: AfLogoProps) {
  // Sidebar: sadece logo görseli, yazı yok
  if (variant === "sidebar") {
    return (
      <div className={`relative flex-shrink-0 overflow-hidden ${className}`} style={{ width: size * 5, height: size * 1.5 }}>
        <Image
          src="/autoflow-logo-navbar.png?v=2"
          alt="AutoFlow"
          fill
          className="object-contain object-left scale-[2.8] origin-left"
          priority
        />
      </div>
    )
  }

  // Icon: küçük sadece AF kısmı
  if (variant === "icon") {
    return (
      <div className={`relative flex-shrink-0 overflow-hidden ${className}`} style={{ width: size, height: size }}>
        <Image
          src="/autoflow-logo.png?v=2"
          alt="AutoFlow"
          fill
          className="object-contain scale-[1.7]"
          priority
        />
      </div>
    )
  }

  // Full: büyük tam logo
  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width: size * 4, height: size * 2.2 }}>
      <Image
        src="/autoflow-logo.png?v=2"
        alt="AutoFlow"
        fill
        className="object-contain scale-[1.7]"
        priority
      />
    </div>
  )
}
