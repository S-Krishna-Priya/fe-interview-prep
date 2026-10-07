import { useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Todo } from './types.ts'

type Props = {
  todo: Todo
  onToggle: () => void
  onRename: (title: string) => void
  onDelete: () => void
}

const buttonClass = 'rounded px-2 py-1 text-sm text-gray-600 hover:bg-gray-100'

export default function TodoItem({ todo, onToggle, onRename, onDelete }: Props) {
  // null means "not editing"; a string is the in-progress edit
  const [draft, setDraft] = useState<string | null>(null)

  function startEditing() {
    setDraft(todo.title)
  }

  function cancelEditing() {
    setDraft(null)
  }

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = draft?.trim() ?? ''
    if (title && title !== todo.title) onRename(title)
    setDraft(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') cancelEditing()
  }

  if (draft !== null) {
    return (
      <li className="py-2">
        <form onSubmit={saveEdit} className="flex items-center gap-2">
          <input
            aria-label={`Edit "${todo.title}"`}
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded border border-gray-300 px-2 py-1"
          />
          <button type="submit" className={buttonClass}>
            Save
          </button>
          <button type="button" onClick={cancelEditing} className={buttonClass}>
            Cancel
          </button>
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 py-2">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'active' : 'completed'}`}
        className="size-4"
      />
      <span className={`flex-1 ${todo.completed ? 'text-gray-400 line-through' : ''}`}>
        {todo.title}
      </span>
      <button type="button" onClick={startEditing} className={buttonClass}>
        Edit
      </button>
      <button type="button" onClick={onDelete} className={buttonClass}>
        Delete
      </button>
    </li>
  )
}
