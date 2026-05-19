import ViewerWrapper from '@/components/viewer/ViewerWrapper'
import type { Annotations, AiResults } from '@/types'

// Pagina pubblica temporanea per testare il viewer — nessuna autenticazione richiesta.
// Da eliminare dopo il test.

const FAKE_ANNOTATIONS: Annotations = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[2980,3950],[3080,3950],[3080,4050],[2980,4050],[2980,3950]]],
      },
      properties: { class: 'glomerulus', label: 'Glomerulo 1', confidence: 0.95, area: 10000, perimeter: 400 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[3200,4100],[3320,4100],[3320,4220],[3200,4220],[3200,4100]]],
      },
      properties: { class: 'glomerulus', label: 'Glomerulo 2', confidence: 0.91, area: 14400, perimeter: 480 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[2750,4300],[2870,4300],[2870,4420],[2750,4420],[2750,4300]]],
      },
      properties: { class: 'glomerulus', label: 'Glomerulo 3', confidence: 0.88, area: 14400, perimeter: 480 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[3500,3800],[3620,3800],[3620,3920],[3500,3920],[3500,3800]]],
      },
      properties: { class: 'sclerosed_glomerulus', label: 'G. Sclerotico 1', confidence: 0.93, area: 14400, perimeter: 480, banff: 'ci2' },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[2600,3700],[2720,3700],[2720,3820],[2600,3820],[2600,3700]]],
      },
      properties: { class: 'sclerosed_glomerulus', label: 'G. Sclerotico 2', confidence: 0.85, area: 14400, perimeter: 480, banff: 'ci3' },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[2900,4500],[2950,4500],[2950,4560],[2900,4560],[2900,4500]]],
      },
      properties: { class: 'tubule_proximal', label: 'Tubulo Pross. 1', confidence: 0.82, area: 3600, perimeter: 240 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[3100,4500],[3150,4500],[3150,4560],[3100,4560],[3100,4500]]],
      },
      properties: { class: 'tubule_proximal', label: 'Tubulo Pross. 2', confidence: 0.87, area: 3600, perimeter: 240 },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [[[3300,4550],[3350,4550],[3350,4610],[3300,4610],[3300,4550]]],
      },
      properties: { class: 'tubule_proximal', label: 'Tubulo Pross. 3', confidence: 0.90, area: 3600, perimeter: 240 },
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
      tubuli_prossimali:    3,
      tubuli_distali:       0,
    },
  },
}

export default function ViewerDemoPage() {
  return (
    <div className="fixed inset-0 flex flex-col bg-[#0a0a0a]">
      <ViewerWrapper
        dziUrl="/api/tiles/test/highsmith.dzi"
        annotations={FAKE_ANNOTATIONS}
        results={FAKE_RESULTS}
        loadingText="Caricamento vetrino demo..."
      />
    </div>
  )
}
