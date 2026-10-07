import { Navigate, NavLink, Route, Routes } from 'react-router'
import TodoPage from './features/todo/TodoPage.tsx'

const questions = [
  { path: '/todo', label: 'Q1 Todo' },
  { path: '/search', label: 'Q2 Search' },
  { path: '/wizard', label: 'Q3 Wizard' },
  { path: '/table', label: 'Q4 Table' },
  { path: '/login', label: 'Q5 Login' },
]

function NotBuiltYet({ title }: { title: string }) {
  return (
    <>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-muted">This question is not built yet.</p>
    </>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-4 px-4 py-3">
          <span className="font-semibold tracking-tight text-primary">FE Interview Prep</span>
          <nav aria-label="Questions" className="flex flex-wrap gap-1">
            {questions.map((question) => (
              <NavLink
                key={question.path}
                to={question.path}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary text-white'
                      : 'text-muted hover:bg-primary-soft hover:text-primary'
                  }`
                }
              >
                {question.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/todo" replace />} />
          <Route path="/todo" element={<TodoPage />} />
          <Route path="/search" element={<NotBuiltYet title="Live Search" />} />
          <Route path="/wizard" element={<NotBuiltYet title="Registration Wizard" />} />
          <Route path="/table" element={<NotBuiltYet title="Data Table" />} />
          <Route path="/login" element={<NotBuiltYet title="Login & Session Handling" />} />
        </Routes>
      </main>
    </div>
  )
}
