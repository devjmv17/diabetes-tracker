"use client"

import { useState } from "react"
import { Droplets, Heart } from "lucide-react"

interface DashboardTabsProps {
  glucosaContent: React.ReactNode
  tensionContent: React.ReactNode
}

export default function DashboardTabs({ glucosaContent, tensionContent }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"glucosa" | "tension">("glucosa")

  return (
    <div>
      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("glucosa")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeTab === "glucosa"
              ? "bg-blue-600 text-white shadow-md shadow-blue-200"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <Droplets className="w-5 h-5" />
          Glucosa
        </button>
        <button
          onClick={() => setActiveTab("tension")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
            activeTab === "tension"
              ? "bg-red-600 text-white shadow-md shadow-red-200"
              : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <Heart className="w-5 h-5" />
          Tensión Arterial
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "glucosa" && glucosaContent}
        {activeTab === "tension" && tensionContent}
      </div>
    </div>
  )
}
