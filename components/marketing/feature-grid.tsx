"use client"

import { memo } from "react"
import { Award } from "lucide-react"

import type { MarketingFeature } from "@/app/(marketing)/data/home-content"
import { Badge } from "@/components/ui/badge"

interface FeatureGridProps {
  features: MarketingFeature[]
}

function FeatureGridComponent({ features }: FeatureGridProps) {
  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="text-center mb-16">
          <Badge className="bg-white/10 text-white border-white/20 px-4 py-2 mb-6">
            <Award className="w-4 h-4 mr-2" />
            Cinema-Grade Features
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Built for the Future of
            <span className="text-white/80 block">Social Entertainment</span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Experience cutting-edge technology designed for seamless social viewing
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className="group bg-white/5 backdrop-blur-sm rounded-lg p-8 border border-white/10 hover:border-white/20 transition-all duration-500 hover:scale-105"
              >
                <div className="flex items-start space-x-4">
                  <div className="p-4 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all duration-300">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-white/90 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-white/60 leading-relaxed mb-3">{feature.description}</p>
                    <div className="text-sm text-white/80 font-medium">{feature.stats}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export const FeatureGrid = memo(FeatureGridComponent)
