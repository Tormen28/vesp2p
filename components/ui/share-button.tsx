"use client"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShareButtonProps {
  sellPrice: number | null
  buyPrice: number | null
  lastUpdated: Date | null
}

export function ShareButton({ sellPrice, buyPrice, lastUpdated }: ShareButtonProps) {
  const [isCopied, setIsCopied] = useState(false)
  const { toast } = useToast()

  const handleShare = async () => {
    if (sellPrice === null || buyPrice === null) return

    const timeAgo = lastUpdated
      ? `${Math.floor((Date.now() - lastUpdated.getTime()) / 60000)} min ago`
      : "just now"

    const shareText = `📊 USDT/VES P2P
💰 Venta: ${sellPrice.toFixed(2)} VES
📈 Compra: ${buyPrice.toFixed(2)} VES
🕐 Updated: ${timeAgo}
🔗 Source: vesp2p`

    try {
      await navigator.clipboard.writeText(shareText)
      setIsCopied(true)
      toast({
        title: "¡Copiado!",
        description: "Precios copiados al portapapeles",
        duration: 2000,
      })
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleShare()
        }
      }}
      className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      aria-label={sellPrice && buyPrice
        ? `Compartir precios: Venta ${sellPrice.toFixed(2)} VES, Compra ${buyPrice.toFixed(2)} VES`
        : "Compartir precios"}
    >
      <Share2 className="h-5 w-5" />
    </button>
  )
}
