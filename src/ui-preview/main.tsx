import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/jetbrains-mono/500.css'
import './preview.css'
import { PreviewShell } from './PreviewShell'
import { WorkspacePage } from './WorkspacePage'
import { WorkbasketPage } from './WorkbasketPage'
import { ClaimsPage } from './ClaimsPage'

const routes: Record<string, string> = {
  '/ui-preview/workbasket': 'Workbasket',
  '/ui-preview/claims': 'Claims',
  '/ui-preview/workspace': 'Claim workspace',
}
const path = window.location.pathname.replace(/\/$/, '')
if (!path || path === '/ui-preview') window.location.replace('/ui-preview/workbasket')
const page = routes[path]

ReactDOM.createRoot(document.getElementById('preview-root')!).render(
  <React.StrictMode>
    <PreviewShell page={page || 'Page not found'}>
      {page === 'Workbasket' ? <WorkbasketPage /> : page === 'Claims' ? <ClaimsPage /> : page === 'Claim workspace' ? <WorkspacePage /> : (
        <div className="pv-page-heading">
          <h1>Page not found</h1>
          <p>This address is outside the design preview.</p>
          <a href="/ui-preview/workbasket">Return to Workbasket preview</a>
        </div>
      )}
    </PreviewShell>
  </React.StrictMode>,
)
