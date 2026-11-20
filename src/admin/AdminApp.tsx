import { BrowserRouter, Route, Routes } from 'react-router'
import { MotionConfig } from 'framer-motion'
import { AuthProvider, useAuth } from './lib/auth'
import { PendingProvider } from './lib/pending'
import { isConfigured } from './lib/supabase'
import { ToastProvider } from './components/Toast'
import { Layout } from './components/Layout'
import { Login, SetupGuide } from './components/Login'
import { Overview } from './pages/Overview'
import { CollectionList } from './pages/CollectionList'
import { CollectionEditor } from './pages/CollectionEditor'
import { ProfilePage } from './pages/ProfilePage'
import { MediaPage } from './pages/MediaPage'
import { PublishPage } from './pages/PublishPage'
import { ActivityPage, AnalyticsPage, InboxPage } from './pages/InsightPages'
import { ErrorNote } from './components/ui'

function Gate() {
  const { state } = useAuth()
  if (state.status !== 'admin') return <Login />

  return (
    <PendingProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Overview />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="publish" element={<PublishPage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path=":collection" element={<CollectionList />} />
          <Route path=":collection/:id" element={<CollectionEditor />} />
          <Route path="*" element={<ErrorNote error="zsh: no such file or directory" />} />
        </Route>
      </Routes>
    </PendingProvider>
  )
}

export function AdminApp() {
  if (!isConfigured) return <SetupGuide />
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter basename="/admin">
            <Gate />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </MotionConfig>
  )
}
