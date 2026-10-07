import { Navigate, NavLink, Route, Routes } from 'react-router'
import SearchPage from './features/search/SearchPage.tsx'
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
      <p className="mt-2 text-gray-600">This question is not built yet.</p>
    </>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <nav aria-label="Questions" className="mx-auto flex max-w-3xl flex-wrap gap-2 px-4 py-3">
          {questions.map((question) => (
            <NavLink
              key={question.path}
              to={question.path}
              className={({ isActive }) =>
                `rounded px-3 py-1.5 text-sm font-medium ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {question.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/todo" replace />} />
          <Route path="/todo" element={<TodoPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/wizard" element={<NotBuiltYet title="Registration Wizard" />} />
          <Route path="/table" element={<NotBuiltYet title="Data Table" />} />
          <Route path="/login" element={<NotBuiltYet title="Login & Session Handling" />} />
        </Routes>
      </main>
    </div>
  )
}
