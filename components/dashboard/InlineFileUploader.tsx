'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, File, CheckCircle2, AlertCircle, Loader2, FileText } from 'lucide-react'
import { getPresignedUploadUrl, confirmUpload } from '@/lib/actions/storage'

interface UploaderProps {
    patientId: string
    dict: any
}

export function InlineFileUploader({ patientId, dict }: UploaderProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const t = dict.dashboard.upload;
  
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

    try {
      const presignedRes = await getPresignedUploadUrl(file.name, file.type, file.size, patientId, notes)
      
      if (presignedRes.error || !presignedRes.url) {
        throw new Error(presignedRes.error || dict.validation.uploadError)
      }

      const xhr = new XMLHttpRequest()
      xhr.open('PUT', presignedRes.url, true)
      xhr.setRequestHeader('Content-Type', file.type)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100))
        }
      }

      xhr.onload = async () => {
        if (xhr.status === 200) {
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
        } else {
          setStatus('error')
          setErrorMessage(dict.validation.cloudflareError)
        }
      }

      xhr.onerror = () => { setStatus('error'); setErrorMessage(dict.validation.networkError) }
      xhr.send(file)

    } catch (err: any) {
      setStatus('error')
      setErrorMessage(err.message)
    }
  }

  return (
    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
        <div 
          onClick={() => status === 'idle' && !file && fileInputRef.current?.click()}
          className={`
            relative w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all bg-white
            ${status === 'uploading' ? 'border-gray-300 cursor-wait bg-gray-50' : ''}
            ${status === 'idle' && !file ? 'border-gray-300 hover:border-black hover:bg-gray-50 cursor-pointer h-48' : 'border-gray-300'}
            ${status === 'success' ? 'border-green-500 bg-green-50 h-48' : ''}
            ${status === 'error' ? 'border-red-500 bg-red-50 h-48' : ''}
          `}
        >
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={status !== 'idle'} />

          {status === 'idle' && !file && (
            <>
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-full mb-3 shadow-sm group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6 text-gray-500" />
              </div>
              <p className="font-bold text-gray-900">{t.title}</p>
              <p className="text-xs text-gray-500 mt-1">{t.dragDrop}</p>
            </>
          )}

          {status === 'idle' && file && (
            <div className="w-full max-w-md space-y-4 cursor-default">
              <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                 <div className="bg-black p-2 rounded-lg">
                    <File className="w-5 h-5 text-white" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / (1024*1024)).toFixed(2)} MB</p>
                 </div>
                 <button onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-xs text-red-500 hover:underline px-2">{t.remove}</button>
              </div>

              <div className="relative">
                 <div className="absolute top-3 left-3 text-gray-400">
                    <FileText className="w-4 h-4" />
                 </div>
                 <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t.notesPlaceholder}
                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-black focus:ring-1 focus:ring-black min-h-[80px] resize-none"
                    onClick={(e) => e.stopPropagation()} 
                 />
              </div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); startUpload(); }}
                className="w-full bg-black text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
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
                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                   <div className="bg-black h-1.5 rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
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
               <button onClick={(e) => { e.stopPropagation(); setStatus('idle'); }} className="mt-4 text-xs font-bold underline text-red-700">{t.retry}</button>
             </div>
          )}
        </div>
    </div>
  )
}