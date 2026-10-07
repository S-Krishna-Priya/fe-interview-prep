import { lazy, Suspense } from 'react'
import { Navigate, NavLink, Route, Routes } from 'react-router'
import AuthProvider from './features/auth/AuthProvider.tsx'
import RequireAuth from './features/auth/RequireAuth.tsx'
import TodoPage from './features/todo/TodoPage.tsx'

const SearchPage = lazy(() => import('./features/search/SearchPage.tsx'))
const WizardPage = lazy(() => import('./features/wizard/WizardPage.tsx'))
const TablePage = lazy(() => import('./features/table/TablePage.tsx'))
const LoginPage = lazy(() => import('./features/auth/LoginPage.tsx'))
const AccountPage = lazy(() => import('./features/auth/AccountPage.tsx'))
const AdminPage = lazy(() => import('./features/auth/AdminPage.tsx'))

const questions = [
  { path: '/todo', label: 'Q1 Todo' },
  { path: '/search', label: 'Q2 Search' },
  { path: '/wizard', label: 'Q3 Wizard' },
  { path: '/table', label: 'Q4 Table' },
  { path: '/login', label: 'Q5 Login' },
]

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
        <AuthProvider>
          <Suspense fallback={<p role="status">Loading…</p>}>
            <Routes>
              <Route path="/" element={<Navigate to="/todo" replace />} />
              <Route path="/todo" element={<TodoPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/wizard" element={<WizardPage />} />
              <Route path="/table" element={<TablePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/account"
                element={
                  <RequireAuth>
                    <AccountPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/admin"
                element={
                  <RequireAuth role="admin">
                    <AdminPage />
                  </RequireAuth>
                }
              />
            </Routes>
          </Suspense>
        </AuthProvider>
      </main>
    </div>
  )
}
