export default function Loader({ text = 'Carregando...', fullscreen = false }) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-2 border-brand-500/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-brand-500 animate-spin" />
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-brand-500/20 to-accent-500/20 animate-pulse" />
      </div>
      <p className="text-slate-400 text-sm animate-pulse">{text}</p>
    </div>
  )

  if (fullscreen) return (
    <div className="fixed inset-0 bg-dark-900 flex items-center justify-center z-50">{content}</div>
  )
  return <div className="flex items-center justify-center py-16">{content}</div>
}
