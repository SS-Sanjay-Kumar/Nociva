import { AlertTriangle, Loader2, ServerCrash } from 'lucide-react'

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-500 py-6">
      <Loader2 className="animate-spin" size={18} />
      <span>{label}</span>
    </div>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 text-red-800 px-4 py-3">
      <ServerCrash size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">Something went wrong</p>
        <p className="text-sm text-red-700">{message}</p>
      </div>
    </div>
  )
}

export function UnsupportedState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 px-4 py-3">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">Unsupported input</p>
        <p className="text-sm text-amber-700">{message}</p>
      </div>
    </div>
  )
}
