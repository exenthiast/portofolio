import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import { AdminApp } from './AdminApp'

const root = document.getElementById('root')
if (!root) throw new Error('#root missing')

createRoot(root).render(
  <StrictMode>
    <AdminApp />
  </StrictMode>,
)
