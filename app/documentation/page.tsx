import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { getDictionary } from '@/lib/dictionary'
import { Metadata } from 'next'
import Link from 'next/link'
import {
  BookOpen, Upload, Users, BarChart3, ScanSearch,
  FolderArchive, ShieldCheck, ChevronRight, Microscope,
  Zap, Globe, ArrowRight
} from 'lucide-react'

export async function generateMetadata(): Promise<Metadata> {
  return { title: 'Documentation' }
}

const SECTIONS = [
  { id: 'getting-started', icon: BookOpen,     label: 'Getting Started' },
  { id: 'patients',        icon: Users,        label: 'Patient Management' },
  { id: 'upload',          icon: Upload,       label: 'Upload & Analysis' },
  { id: 'results',         icon: BarChart3,    label: 'Understanding Results' },
  { id: 'viewer',          icon: ScanSearch,   label: 'DZI Viewer' },
  { id: 'qupath',          icon: FolderArchive,label: 'QuPath Integration' },
  { id: 'security',        icon: ShieldCheck,  label: 'Security & Compliance' },
]

export default async function DocumentationPage() {
  const dict = await getDictionary()

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col">
      <Header variant="public" />

      {/* Hero */}
      <div className="border-b border-gray-100 bg-gray-50 py-16">
        <div className="layout-container px-6">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-400 uppercase tracking-widest mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Documentation
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-3">Histyon Developer Docs</h1>
          <p className="text-base text-gray-500 max-w-xl">
            Everything you need to upload, analyse, and manage histological slides on the Histyon platform.
          </p>
          <div className="flex items-center gap-6 mt-6">
            <a href="#getting-started" className="btn-elegant py-2 px-5 text-sm">
              Quick Start <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <Link href="/auth/register" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors flex items-center gap-1.5">
              Create account <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Body: sidebar + content */}
      <div className="layout-container px-6 flex-1 flex flex-col md:flex-row gap-12 py-16">

        {/* Left nav */}
        <aside className="md:w-52 shrink-0">
          <nav className="sticky top-24 space-y-0.5">
            {SECTIONS.map(({ id, icon: Icon, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="flex items-center gap-2.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors group"
              >
                <Icon className="w-3.5 h-3.5 shrink-0 group-hover:text-gray-700 transition-colors" />
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 max-w-3xl space-y-20">

          {/* Getting Started */}
          <Section id="getting-started" icon={BookOpen} title="Getting Started">
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              Histyon is a cloud-native platform for histopathological slide management and AI-powered tissue analysis. 
              Access is restricted to verified medical professionals — pathologists, oncologists, and clinical researchers.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { step: '01', title: 'Register', desc: 'Create an account with your medical license number and institutional email.' },
                { step: '02', title: 'Add Patient', desc: 'Create a patient folder with demographic data and contact information.' },
                { step: '03', title: 'Upload & Analyse', desc: 'Upload a WSI file (SVS, NDPI, TIFF) and the AI pipeline starts automatically.' },
              ].map(({ step, title, desc }) => (
                <div key={step} className="border border-gray-200 p-5 bg-white">
                  <p className="text-xs font-mono text-gray-300 mb-2">{step}</p>
                  <h3 className="font-bold text-sm text-gray-900 mb-1.5">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="border border-gray-100 bg-gray-50 p-5 flex gap-3">
              <Microscope className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong className="text-gray-700">Supported formats:</strong> SVS, NDPI, TIFF, MRXS, SCN, CZI, BIF, DCM. 
                Maximum file size: 5 GB per upload.
              </p>
            </div>
          </Section>

          {/* Patient Management */}
          <Section id="patients" icon={Users} title="Patient Management">
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              Each patient has a dedicated folder containing their demographic profile, contact information, residential address, 
              and a complete history of all uploaded analyses. Patient data is isolated by Row Level Security — only the 
              physician who created the record can access it.
            </p>
            <CodeBlock label="Patient data structure">
{`{
  id:           uuid (auto-generated)
  first_name:   string
  last_name:    string
  fiscal_code:  string (16 chars)
  date_of_birth: date
  gender:       M | F | OTHER
  place_of_birth: string
  email:        string
  phone:        string
  country:      string
  city:         string
  province:     string
  // ...
}`}
            </CodeBlock>
            <Note>
              Patient records cannot be deleted once created. Contact support if you need to anonymise or transfer records.
            </Note>
          </Section>

          {/* Upload & Analysis */}
          <Section id="upload" icon={Upload} title="Upload & Analysis">
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              Files are uploaded directly to Cloudflare R2 via a server-generated presigned URL — 
              the binary data never passes through the Histyon application server. Once the upload 
              is confirmed, the ticket status changes to <Code>QUEUED</Code> and the AI engine picks it up automatically.
            </p>
            <div className="space-y-3 mb-6">
              {[
                { status: 'UPLOADING',  desc: 'File is being transferred to cloud storage.' },
                { status: 'QUEUED',     desc: 'Upload confirmed. Waiting for the AI worker to pick up the job.' },
                { status: 'PROCESSING', desc: 'Neural network is segmenting and classifying the slide.' },
                { status: 'COMPLETED',  desc: 'Analysis finished. Results and output files are available.' },
                { status: 'ERROR',      desc: 'Something went wrong. Use "Retry Upload" to create a new ticket.' },
              ].map(({ status, desc }) => (
                <div key={status} className="flex items-start gap-3">
                  <Code>{status}</Code>
                  <p className="text-xs text-gray-500 pt-0.5">{desc}</p>
                </div>
              ))}
            </div>
            <Note>
              The upload interface shows real-time progress via WebSocket (Supabase Realtime). 
              You do not need to keep the browser tab open — the analysis continues on the server.
            </Note>
          </Section>

          {/* Understanding Results */}
          <Section id="results" icon={BarChart3} title="Understanding Results">
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              When an analysis completes, three output artefacts are generated and stored in Cloudflare R2:
            </p>
            <div className="space-y-4 mb-6">
              {[
                { field: 'output_dzi',    label: 'DZI tile pyramid',  desc: 'A Deep Zoom Image tile set used by the integrated viewer for high-resolution pan & zoom navigation.' },
                { field: 'output_region', label: 'Region output',     desc: 'A ZIP archive containing annotated region masks and coordinates in GeoJSON format.' },
                { field: 'qupath_project',label: 'QuPath project',    desc: 'A pre-configured QuPath project ZIP. Open it in QuPath for second-level manual review and measurement.' },
              ].map(({ field, label, desc }) => (
                <div key={field} className="border border-gray-100 p-4">
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <code className="text-xs font-mono text-gray-700 bg-gray-100 px-1.5 py-0.5">{field}</code>
                    <span className="text-xs font-bold text-gray-700">{label}</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              The <strong>ai_results</strong> JSON column contains structured summary data: overall diseased tissue percentage, 
              glomeruli count, sclerotic glomeruli count, and per-region segmentation metadata.
            </p>
          </Section>

          {/* Viewer */}
          <Section id="viewer" icon={ScanSearch} title="DZI Viewer">
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              The integrated viewer uses OpenSeadragon to render Deep Zoom Image tile sets directly in the browser. 
              It supports pan, zoom, and fullscreen navigation with no plugins required.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { key: '+', action: 'Zoom in' },
                { key: '-', action: 'Zoom out' },
                { key: '⌂', action: 'Fit to window' },
                { key: '⛶', action: 'Toggle fullscreen' },
              ].map(({ key, action }) => (
                <div key={key} className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-4 py-3">
                  <span className="text-xs font-mono font-bold bg-white border border-gray-200 w-7 h-7 flex items-center justify-center">{key}</span>
                  <span className="text-xs text-gray-600">{action}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 p-4">
              <Zap className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">
                The viewer pre-fetches tiles progressively. Loading time depends on network speed and the tile resolution 
                requested. Tiles are served directly from Cloudflare R2 with edge caching — typical first-tile latency is under 300 ms.
              </p>
            </div>
          </Section>

          {/* QuPath */}
          <Section id="qupath" icon={FolderArchive} title="QuPath Integration">
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              Each completed analysis includes a downloadable QuPath project. 
              This allows you to open the slide in QuPath (v0.4+) with all AI annotations pre-loaded for manual review.
            </p>
            <ol className="space-y-3 text-sm text-gray-500 mb-6 list-none">
              {[
                'Download the .zip file from the analysis page.',
                'Unzip the archive in a local directory.',
                'Open QuPath and select File → Open Project.',
                'Navigate to the unzipped folder and select the project.qpproj file.',
                'The slide opens with AI annotations already overlaid.',
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-[10px] font-mono font-bold text-gray-300 mt-0.5 w-4 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                  <span className="text-xs leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
            <Note>QuPath is free open-source software. Download it at <a href="https://qupath.github.io" target="_blank" rel="noopener noreferrer" className="underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900 transition-colors">qupath.github.io</a>.</Note>
          </Section>

          {/* Security */}
          <Section id="security" icon={ShieldCheck} title="Security & Compliance">
            <p className="text-gray-500 mb-6 text-sm leading-relaxed">
              Histyon is built for medical environments. Here is a summary of the security architecture.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { title: 'Transport',    body: 'All traffic is encrypted with TLS 1.3. HSTS enforced in production.' },
                { title: 'Storage',      body: 'Data at rest in Supabase (PostgreSQL) and Cloudflare R2 uses AES-256.' },
                { title: 'Row Security', body: 'Postgres RLS policies ensure each doctor sees only their own data.' },
                { title: 'Sessions',     body: 'JWT-based sessions with 30-minute idle timeout in the dashboard.' },
                { title: 'Headers',      body: 'CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy.' },
                { title: 'GDPR',         body: 'Platform operates within EEA. Physicians act as Data Controllers under Art. 4 GDPR.' },
              ].map(({ title, body }) => (
                <div key={title} className="border border-gray-100 p-4">
                  <p className="text-xs font-bold text-gray-700 mb-1">{title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3 bg-gray-50 border border-gray-100 p-4">
              <Globe className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">
                For Data Processing Agreements, audit logs, or security disclosures contact{' '}
                <a href="mailto:security@histyon.com" className="underline decoration-gray-300 underline-offset-2 hover:decoration-gray-900 transition-colors">security@histyon.com</a>.
              </p>
            </div>
          </Section>

        </main>
      </div>

      <Footer />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Section({ id, icon: Icon, title, children }: {
  id: string; icon: React.ElementType; title: string; children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <Icon className="w-4 h-4 text-gray-400" />
        <h2 className="text-lg font-bold tracking-tight text-gray-900">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function CodeBlock({ label, children }: { label: string; children: string }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest mb-2">{label}</p>
      <pre className="bg-gray-50 border border-gray-200 p-4 text-xs font-mono text-gray-700 overflow-x-auto leading-relaxed whitespace-pre">
        {children}
      </pre>
    </div>
  )
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-xs font-mono bg-gray-100 border border-gray-200 px-1.5 py-0.5 text-gray-700 shrink-0">
      {children}
    </code>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-gray-200 pl-4 text-xs text-gray-500 leading-relaxed italic">
      {children}
    </div>
  )
}
