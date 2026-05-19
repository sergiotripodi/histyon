'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, File, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react'
import { getPresignedUploadUrl, confirmUpload } from '@/lib/actions/storage'

interface UploaderProps {
  patientId: string
  dict:      any
}

export function InlineFileUploader({ patientId, dict }: UploaderProps) {
  const router      = useRouter()
  const [file, setFile]             = useState<File | null>(null)
  const [notes, setNotes]           = useState('')
  const [progress, setProgress]     = useState(0)
  const [status, setStatus]         = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const t           = dict.dashboard.upload
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setStatus('idle')
      setErrorMessage('')
    }
  }

  const startUpload = async () => {
    if (!file) return
    setStatus('uploading')
    setProgress(0)
    try {
      // Ottieni la signed upload URL da Supabase Storage (server action)
      const presignedRes = await getPresignedUploadUrl(file.name, file.type, file.size, patientId, notes)
      if (presignedRes.error || !presignedRes.url) {
        throw new Error(presignedRes.error || dict.validation.uploadError)
      }

      // Upload diretto a Supabase Storage via XHR (con progress tracking)
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        // Supabase signed upload URL — metodo PUT, Content-Type corretto
        xhr.open('PUT', presignedRes.url, true)
        xhr.setRequestHeader('Content-Type', presignedRes.contentType ?? file.type)

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100))
        }

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve()
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        }

        xhr.onerror = () => reject(new Error(dict.validation.networkError))
        xhr.send(file)
      })

      // Segna il ticket come QUEUED
      await confirmUpload(presignedRes.ticketId)
      setStatus('success')
      router.refresh()
      setTimeout(() => {
        setFile(null)
        setNotes('')
        setStatus('idle')
        setProgress(0)
        if (fileInputRef.current) fileInputRef.current.value = ''
      }, 2000)
    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message || dict.validation.genericError)
    }
  }

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div
        onClick={() => status === 'idle' && !file && fileInputRef.current?.click()}
        className={`relative w-full border-2 border-dashed p-6 flex flex-col items-center justify-center transition-all bg-white
          ${status === 'uploading' ? 'border-gray-300 cursor-wait bg-gray-50' : ''}
          ${status === 'idle' && !file ? 'border-gray-300 hover:border-black hover:bg-gray-50 cursor-pointer h-40' : 'border-gray-300'}
          ${status === 'success'  ? 'border-emerald-400 bg-emerald-50/40 h-40' : ''}
          ${status === 'error'    ? 'border-red-300 bg-red-50/40 h-40' : ''}
        `}
      >
        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={status !== 'idle'} />

        {status === 'idle' && !file && (
          <>
            <div className="bg-gray-50 border border-gray-200 p-3 mb-3">
              <UploadCloud className="w-6 h-6 text-gray-500" />
            </div>
            <p className="font-bold text-gray-900 text-sm">{t.title}</p>
            <p className="text-xs text-gray-500 mt-1">{t.dragDrop}</p>
          </>
        )}

        {status === 'idle' && file && (
          <div className="w-full max-w-md space-y-4 cursor-default">
            <div className="flex items-center gap-4 bg-gray-50 p-3 border border-gray-200">
              <div className="bg-white p-2 border border-gray-900">
                <File className="w-5 h-5 text-gray-900" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="text-xs text-red-500 hover:underline px-2"
              >
                {t.remove}
              </button>
            </div>
            <div className="relative">
              <div className="absolute top-3 left-3 text-gray-400">
                <FileText className="w-4 h-4" />
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t.notesPlaceholder}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 outline-none focus:border-gray-900 min-h-[80px] resize-none transition-all duration-200"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); startUpload() }}
              className="btn-elegant w-full px-6 py-3 text-sm font-bold"
            >
              <UploadCloud className="w-4 h-4" /> {t.btnStart}
            </button>
          </div>
        )}

        {status === 'uploading' && (
          <div className="w-full max-w-xs text-center h-full flex flex-col justify-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span className="font-bold text-black">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 h-1.5 overflow-hidden">
              <div className="bg-black h-1.5 transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2 animate-pulse">{t.sending}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="h-full flex flex-col justify-center items-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mb-2 animate-in zoom-in" />
            <p className="font-bold text-green-700">{t.successTitle}</p>
            <p className="text-xs text-green-600">{t.successMsg}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="h-full flex flex-col justify-center items-center">
            <AlertCircle className="w-10 h-10 text-red-600 mb-2" />
            <p className="font-bold text-red-700">{t.errorTitle}</p>
            <p className="text-xs text-red-600 mt-1 max-w-xs text-center">{errorMessage}</p>
            <button
              onClick={(e) => { e.stopPropagation(); setStatus('idle') }}
              className="mt-4 text-xs font-bold underline text-red-700"
            >
              {t.retry}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
