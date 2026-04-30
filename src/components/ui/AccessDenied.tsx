import { ShieldAlert } from 'lucide-react'

export function AccessDenied({ resource }: { resource: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-coral-200 bg-coral-50 text-coral-600">
        <ShieldAlert size={24} strokeWidth={1.75} />
      </div>
      <h1 className="text-[22px] font-semibold tracking-tight text-ink-900">
        Access denied
      </h1>
      <p className="mt-2 max-w-sm text-[13.5px] text-ink-500">
        You don't have permission to view {resource}. If you think this is wrong, ask an admin to check your role.
      </p>
    </div>
  )
}
