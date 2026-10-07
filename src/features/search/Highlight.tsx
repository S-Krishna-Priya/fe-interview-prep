function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type HighlightProps = {
  text: string
  query: string
}

export default function Highlight({ text, query }: HighlightProps) {
  const needle = query.trim()
  if (!needle) return text

  const parts = text.split(new RegExp(`(${escapeRegExp(needle)})`, 'i'))
  const lowerNeedle = needle.toLowerCase()

  return parts.map((part, index) =>
    part.toLowerCase() === lowerNeedle ? (
      <mark key={`${index}-${part}`} className="rounded-sm bg-yellow-200 text-inherit">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}
