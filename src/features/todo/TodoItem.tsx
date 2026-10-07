import { useState, type FormEvent, type KeyboardEvent } from 'react'
import type { Todo } from './types.ts'

type Props = {
  todo: Todo
  onToggle: () => void
  onRename: (title: string) => void
  onDelete: () => void
}

const actionClass =
  'rounded-md px-2 py-1 text-sm font-medium text-muted transition-colors hover:bg-primary-soft hover:text-primary'

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
      <li className="px-3 py-2">
        <form onSubmit={saveEdit} className="flex items-center gap-2">
          <input
            aria-label={`Edit "${todo.title}"`}
            autoFocus
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-md border border-line px-2 py-1 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="submit" className={actionClass}>
            Save
          </button>
          <button type="button" onClick={cancelEditing} className={actionClass}>
            Cancel
          </button>
        </form>
      </li>
    )
  }

  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
        aria-label={`Mark "${todo.title}" as ${todo.completed ? 'active' : 'completed'}`}
        className="size-4 accent-primary"
      />
      <span
        className={`min-w-0 flex-1 break-words ${todo.completed ? 'text-muted line-through' : ''}`}
      >
        {todo.title}
      </span>
      <button
        type="button"
        onClick={startEditing}
        aria-label={`Edit "${todo.title}"`}
        className={actionClass}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete "${todo.title}"`}
        className={`${actionClass} hover:bg-danger-soft hover:text-danger`}
      >
        Delete
      </button>
    </li>
  )
}
