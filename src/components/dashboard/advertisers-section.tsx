"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AdvertisersTable } from "@/components/advertisers-table"
import { ArrowDown, ArrowUp, Award, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { P2PData } from "@/types"

interface AdvertisersSectionProps {
  sellData: P2PData | null
  buyData: P2PData | null
  isLoadingSell: boolean
  isLoadingBuy: boolean
}

export function AdvertisersSection({
  sellData,
  buyData,
  isLoadingSell,
  isLoadingBuy,
}: AdvertisersSectionProps) {
  const [activeTab, setActiveTab] = useState<"sell" | "buy">("sell")

  const currentData = activeTab === "sell" ? sellData : buyData
  const isLoading = activeTab === "sell" ? isLoadingSell : isLoadingBuy

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              {activeTab === "sell" ? (
                <ArrowDown className="h-5 w-5 text-green-500" />
              ) : (
                <ArrowUp className="h-5 w-5 text-blue-500" />
              )}
              Anunciantes
            </CardTitle>
            <CardDescription className="flex items-center gap-1">
              <Award className="h-4 w-4 text-amber-600" />
              {activeTab === "sell"
                ? "Anunciantes que compran tus USDT"
                : "Anunciantes que venden USDT"}
              {currentData?.filterInfo?.usingAllAds && (
                <Badge variant="outline" className="ml-2 bg-yellow-50 text-yellow-800">
                  <Info className="h-3 w-3 mr-1" />
                  Mostrando todos
                </Badge>
              )}
            </CardDescription>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "sell" | "buy")}
          className="mt-4"
        >
          <TabsList>
            <TabsTrigger value="sell" className="gap-2">
              <ArrowDown className="h-4 w-4 text-green-500" />
              Vender USDT
            </TabsTrigger>
            <TabsTrigger value="buy" className="gap-2">
              <ArrowUp className="h-4 w-4 text-blue-500" />
              Comprar USDT
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sell" className="mt-4">
            <AdvertisersTable
              data={sellData}
              isLoading={isLoadingSell}
              type="sell"
            />
          </TabsContent>

          <TabsContent value="buy" className="mt-4">
            <AdvertisersTable
              data={buyData}
              isLoading={isLoadingBuy}
              type="buy"
            />
          </TabsContent>
        </Tabs>
      </CardHeader>
      <CardContent></CardContent>
    </Card>
  )
}
