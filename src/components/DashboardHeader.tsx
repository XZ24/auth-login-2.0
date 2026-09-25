import { BarChart3, LineChart, List, LogOut, Table } from 'lucide-react'
import etiqaLogo from '../assets/etiqa-logo.png'

export type View = 'dashboard' | 'claims' | 'edp' | 'kpi' | 'trend' | 'assessor'

interface DashboardHeaderProps {
  claimsCount: number
  currentView: View
  onViewChange: (view: View) => void
  onLogout?: () => void
}

export function DashboardHeader({ claimsCount: _claimsCount, currentView, onViewChange, onLogout }: DashboardHeaderProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <img src={etiqaLogo} alt="Etiqa" className="h-8" />
          <h1 className="text-base font-semibold text-slate-800">Travel Claims</h1>
        </div>

        <div className="h-6 w-px bg-slate-200" />

        <nav className="flex items-center gap-1">
          {/* <button
            onClick={() => onViewChange('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'dashboard'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard size={15} />
            Dashboard
          </button> */}
          <button
            onClick={() => onViewChange('claims')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'claims'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <List size={15} />
            All Claims
          </button>
          <button
            onClick={() => onViewChange('edp')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'edp'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Table size={15} />
            EDP Board
          </button>
          <button
            onClick={() => onViewChange('kpi')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'kpi'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart3 size={15} />
            KPI Monitor
          </button>
          <button
            onClick={() => onViewChange('trend')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'trend'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <LineChart size={15} />
            Daily Trend
          </button>
          {/*
          <button
            onClick={() => onViewChange('assessor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              currentView === 'assessor'
                ? 'bg-blue-50 text-blue-700'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <MessageSquareWarning size={15} />
            Payment Fail
          </button>
          */}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {/* <span className="text-xs text-slate-400">{claimsCount} loaded &middot; 7,000 outstanding</span> */}
        {/* <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-medium">NA</div>
          <span className="text-sm text-slate-700">Nurul Aisyah</span>
        </div> */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={15} />
            Logout
          </button>
        )}
      </div>
    </header>
  )
}
