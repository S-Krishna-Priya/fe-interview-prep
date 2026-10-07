type LoadErrorProps = {
  title: string
  message: string
  onRetry: () => void
}

export default function LoadError({ title, message, onRetry }: LoadErrorProps) {
  return (
    <div role="alert" className="mt-4 rounded border border-red-200 bg-red-50 p-4">
      <p className="font-medium text-red-800">{title}</p>
      <p className="mt-1 text-sm text-red-700">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded bg-red-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-800"
      >
        Retry
      </button>
    </div>
  )
}
