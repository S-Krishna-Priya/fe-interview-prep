import { useState, type FormEvent } from 'react'
import { useLocalStorage } from '../../lib/useLocalStorage.ts'
import TodoItem from './TodoItem.tsx'
import type { Filter, Todo } from './types.ts'

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

function isTodo(value: unknown): value is Todo {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'completed' in value &&
    typeof value.completed === 'boolean'
  )
}

function isTodoList(value: unknown): value is Todo[] {
  return Array.isArray(value) && value.every(isTodo)
}

function isFilter(value: unknown): value is Filter {
  return FILTERS.some((filter) => filter.value === value)
}

function matchesFilter(todo: Todo, filter: Filter) {
  if (filter === 'active') return !todo.completed
  if (filter === 'completed') return todo.completed
  return true
}

export default function TodoPage() {
  const [todos, setTodos] = useLocalStorage<Todo[]>('todos', [], isTodoList)
  const [filter, setFilter] = useLocalStorage<Filter>('todos.filter', 'all', isFilter)
  const [newTitle, setNewTitle] = useState('')

  const visibleTodos = todos.filter((todo) => matchesFilter(todo, filter))
  const activeCount = todos.filter((todo) => !todo.completed).length
  const completedCount = todos.length - activeCount
  const emptyMessage =
    todos.length === 0 ? 'No todos yet. Add one above.' : 'Nothing to show for this filter.'

  function addTodo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) return
    setTodos([...todos, { id: crypto.randomUUID(), title, completed: false }])
    setNewTitle('')
  }

  function updateTodo(id: string, changes: Partial<Omit<Todo, 'id'>>) {
    setTodos(todos.map((todo) => (todo.id === id ? { ...todo, ...changes } : todo)))
  }

  function deleteTodo(id: string) {
    setTodos(todos.filter((todo) => todo.id !== id))
  }

  function clearCompleted() {
    setTodos(todos.filter((todo) => !todo.completed))
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Todo App</h1>
      <p className="mt-1 text-sm text-muted">Your list and filter are saved in this browser.</p>

      <section className="mt-6 rounded-xl border border-line bg-surface p-5 shadow-sm">
        <form onSubmit={addTodo} className="flex gap-2">
          <input
            aria-label="New todo"
            placeholder="What needs to be done?"
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            className="flex-1 rounded-md border border-line px-3 py-2 placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="submit"
            className="rounded-md bg-primary px-4 py-2 font-medium text-white transition-colors hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Add
          </button>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="mr-auto text-muted">
            {activeCount} {activeCount === 1 ? 'item' : 'items'} left
          </span>
          <div role="group" aria-label="Filter todos" className="flex gap-1 rounded-md bg-canvas p-1">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
                className={`rounded px-2.5 py-1 font-medium transition-colors ${
                  filter === value
                    ? 'bg-primary text-white'
                    : 'text-muted hover:bg-primary-soft hover:text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={clearCompleted}
            disabled={completedCount === 0}
            className="rounded-md px-2.5 py-1 font-medium text-danger transition-colors hover:bg-danger-soft disabled:text-muted/60 disabled:hover:bg-transparent"
          >
            Clear completed
          </button>
        </div>

        {visibleTodos.length === 0 ? (
          <p className="mt-6 rounded-md border border-dashed border-line py-8 text-center text-muted">
            {emptyMessage}
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-line rounded-md border border-line">
            {visibleTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => updateTodo(todo.id, { completed: !todo.completed })}
                onRename={(title) => updateTodo(todo.id, { title })}
                onDelete={() => deleteTodo(todo.id)}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
