import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ViewerWrapper from '@/components/viewer/ViewerWrapper'
import type { Annotations, AiResults } from '@/types'

const FAKE_ANNOTATIONS: Annotations = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2980, 3950], [3080, 3950], [3080, 4050], [2980, 4050], [2980, 3950],
        ]],
      },
      properties: { class: 'glomerulus', label: 'G1', confidence: 0.95, area: 10000, perimeter: 400 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [3200, 4100], [3320, 4100], [3320, 4220], [3200, 4220], [3200, 4100],
        ]],
      },
      properties: { class: 'glomerulus', label: 'G2', confidence: 0.91, area: 14400, perimeter: 480 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2750, 4300], [2870, 4300], [2870, 4420], [2750, 4420], [2750, 4300],
        ]],
      },
      properties: { class: 'glomerulus', label: 'G3', confidence: 0.88, area: 14400, perimeter: 480 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [3500, 3800], [3620, 3800], [3620, 3920], [3500, 3920], [3500, 3800],
        ]],
      },
      properties: { class: 'sclerosed_glomerulus', label: 'GS1', confidence: 0.93, area: 14400, perimeter: 480, banff: 'ci2' },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2600, 3700], [2720, 3700], [2720, 3820], [2600, 3820], [2600, 3700],
        ]],
      },
      properties: { class: 'sclerosed_glomerulus', label: 'GS2', confidence: 0.85, area: 14400, perimeter: 480, banff: 'ci3' },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2900, 4500], [2950, 4500], [2950, 4560], [2900, 4560], [2900, 4500],
        ]],
      },
      properties: { class: 'tubule_proximal', label: 'TP1', confidence: 0.82, area: 3600, perimeter: 240 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [3100, 4500], [3150, 4500], [3150, 4560], [3100, 4560], [3100, 4500],
        ]],
      },
      properties: { class: 'tubule_proximal', label: 'TP2', confidence: 0.87, area: 3600, perimeter: 240 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [3300, 4550], [3350, 4550], [3350, 4610], [3300, 4610], [3300, 4550],
        ]],
      },
      properties: { class: 'tubule_proximal', label: 'TP3', confidence: 0.90, area: 3600, perimeter: 240 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [2700, 4600], [2750, 4600], [2750, 4660], [2700, 4660], [2700, 4600],
        ]],
      },
      properties: { class: 'tubule_proximal', label: 'TP4', confidence: 0.84, area: 3600, perimeter: 240 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [3050, 3850],
      },
      properties: { class: 'glomerulus', label: 'G-pt', confidence: 0.80 },
    },
  ],
}

const FAKE_RESULTS: AiResults = {
  summary: {
    percentuale_tessuto_malato: 18.4,
    area_totale: 8200000,
    counts: {
      glomeruli:            5,
      glomeruli_sclerotici: 2,
      tubuli_prossimali:    4,
      tubuli_distali:       0,
    },
  },
}

export default async function ViewerTestPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const dziUrl = '/api/tiles/test/highsmith.dzi'

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0a]">
      <div className="flex items-center gap-4 px-5 h-12 border-b border-white/8 shrink-0">
        <Link
          href="/ops-histyon-console/dashboard"
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-xs font-medium tracking-wide"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Dashboard
        </Link>
        <div className="flex-1" />
        <span className="text-white/40 text-xs font-medium tracking-wide">
          Viewer Test — Highsmith Demo
        </span>
        <div className="flex-1" />
        <span className="text-white/20 text-[10px] font-mono uppercase tracking-widest">dev only</span>
      </div>

      <main className="flex-1 relative overflow-hidden">
        <ViewerWrapper
          dziUrl={dziUrl}
          annotations={FAKE_ANNOTATIONS}
          results={FAKE_RESULTS}
          loadingText="Caricamento vetrino demo..."
        />
      </main>
    </div>
  )
}
