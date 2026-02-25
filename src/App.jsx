import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DataTable from './components/DataTable';
import EntityForm from './components/EntityForm';
import Dashboard from './components/Dashboard';
import RequisitionView from './components/RequisitionView';
import SubmitRequisition from './components/SubmitRequisition';
import Login from './components/Login';
import LockScreen from './components/LockScreen';
import CommandPalette from './components/CommandPalette';
import { Sun, Moon, Command, Search as SearchIcon, ChevronsLeft, ChevronsRight, Menu, Building2, Briefcase, Users as UsersIcon, User as UserIcon, LogOut } from 'lucide-react';

function App() {
  const workspaces = {
    'hcj': {
      name: 'Hopital de Juvenat',
      icon: <Building2 size={12} />,
      color: '#ff5f56',
      tables: ['medicaments', 'stock', 'patients', 'ordonnances', 'sorties', 'requisition'],
      inactiveTables: ['ordonnances']
    },
    'rh': {
      name: 'Ressources Humaines',
      icon: <UsersIcon size={12} />,
      color: '#10b981',
      tables: ['personnel', 'timesheet', 'rapport_temps', 'contrats', 'conges', 'evaluations', 'formations'],
      inactiveTables: ['rapport_temps', 'contrats', 'conges', 'evaluations', 'formations']
    },
    'abc': {
      name: 'Administration Bureau Central',
      icon: <Briefcase size={12} />,
      color: '#007aff',
      tables: ['requisition', 'decaissement', 'achats', 'paies'],
      inactiveTables: []
    }
  };

  const [currentWorkspaceKey, setCurrentWorkspaceKey] = useState('hcj');
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('hcj_user');
    if (saved) {
      const parsedUser = JSON.parse(saved);
      if (parsedUser.admin_site && parsedUser.admin_site.length > 0) {
        return parsedUser;
      }
    }
    return null;
  });

  const accessibleWorkspaces = user ? Object.fromEntries(
    Object.entries(workspaces).filter(([key]) => {
      if (key === 'hcj' && user.admin_site?.includes('juvenat')) return true;
      if (key === 'rh' && user.admin_site?.includes('rh')) return true;
      if (key === 'abc' && user.admin_site?.includes('bureau')) return true;
      return false;
    })
  ) : workspaces;

  const actualWorkspaceKey = accessibleWorkspaces[currentWorkspaceKey] ? currentWorkspaceKey : Object.keys(accessibleWorkspaces)[0];
  const currentWorkspace = accessibleWorkspaces[actualWorkspaceKey] || workspaces['hcj'];

  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!user || isLocked) return;
    let timeout;
    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => setIsLocked(true), 120000); // 120,000 ms = 2 minutes
    };
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(name => document.addEventListener(name, resetTimer, true));
    resetTimer();
    return () => {
      clearTimeout(timeout);
      events.forEach(name => document.removeEventListener(name, resetTimer, true));
    };
  }, [user, isLocked]);

  const [currentTable, setCurrentTable] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(240);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTableName, setFormTableName] = useState(null);
  const [formInitialData, setFormInitialData] = useState(null);
  const [lockedFields, setLockedFields] = useState([]);
  const [upsertStock, setUpsertStock] = useState(false);
  const [theme, setTheme] = useState('light');

  // Sidebar resize handler
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;
    const onMouseMove = (e) => {
      const newWidth = Math.min(400, Math.max(180, startWidth + (e.clientX - startX)));
      setSidebarWidth(newWidth);
    };
    const onMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleEdit = (entity) => {
    setEditingEntity(entity);
    setFormTableName(currentTable);
    setFormInitialData(null);
    setLockedFields([]);
    setUpsertStock(false);
    setIsFormOpen(true);
  };

  const handleCreate = (options = {}) => {
    const targetTable = options.tableName || currentTable;
    setEditingEntity(null);
    setFormTableName(targetTable);
    setFormInitialData(options.initialData || null);
    setLockedFields(options.lockedFields || []);
    setUpsertStock(Boolean(options.upsertStock));
    setIsFormOpen(true);
  };

  const handleSave = () => {
    setIsFormOpen(false);
    setFormTableName(null);
    setFormInitialData(null);
    setLockedFields([]);
    setUpsertStock(false);
    const table = currentTable;
    setCurrentTable('');
    setTimeout(() => setCurrentTable(table), 10);
  };

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') setIsSearchOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    !user ? (
      <Login onLoginSuccess={(userData) => {
        setUser(userData);
        localStorage.setItem('hcj_user', JSON.stringify(userData));
      }} />
    ) : isLocked ? (
      <LockScreen user={user} onUnlock={() => setIsLocked(false)} />
    ) : (
      <div
        className="app-container"
        data-theme={theme}
        style={{ '--sidebar-live-width': sidebarCollapsed ? '0px' : `${sidebarWidth}px` }}
      >
        <Sidebar
          workspaces={accessibleWorkspaces}
          currentWorkspaceKey={actualWorkspaceKey}
          onWorkspaceChange={(key) => {
            setCurrentWorkspaceKey(key);
            setCurrentTable('dashboard');
          }}
          tables={currentWorkspace.tables}
          inactiveTables={currentWorkspace.inactiveTables}
          activeTable={currentTable}
          onTableChange={(t) => { setCurrentTable(t); setIsSearchOpen(false); setIsSidebarOpen(false); }}
          isOpen={isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          width={sidebarCollapsed ? 0 : sidebarWidth}
          collapsed={sidebarCollapsed}
          onLock={() => setIsLocked(true)}
          user={user}
          theme={theme}
          onToggleTheme={toggleTheme}
          onLogout={() => { setUser(null); localStorage.removeItem('hcj_user'); }}
        />

        {isSidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Resize handle */}
        {!sidebarCollapsed && (
          <div
            onMouseDown={handleMouseDown}
            style={{
              position: 'fixed',
              left: 'calc(var(--sidebar-live-width) - 2px)',
              top: 0,
              width: '5px',
              height: '100vh',
              cursor: 'col-resize',
              zIndex: 1001,
              backgroundColor: isResizing ? 'var(--primary)' : 'transparent',
              transition: isResizing ? 'none' : 'background-color 0.2s',
            }}
            className="sidebar-resize-handle"
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
            onMouseLeave={(e) => { if (!isResizing) e.currentTarget.style.backgroundColor = 'transparent'; }}
          />
        )}

        {/* Sidebar collapse/expand toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{
            position: 'fixed',
            left: sidebarCollapsed ? '12px' : `calc(${sidebarWidth}px - 12px)`,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1002,
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'left 0.2s ease, opacity 0.2s, background-color 0.2s',
            opacity: 0.6,
            visibility: isSidebarOpen ? 'hidden' : 'visible'
          }}
          className="sidebar-toggle"
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.backgroundColor = 'var(--surface-hover)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.6';
            e.currentTarget.style.backgroundColor = 'var(--background)';
          }}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
        </button>

        <main className="main-content">
          <header className="header">
            <div className="header-title header-left" style={{ gap: '12px' }}>
              <button
                className="btn-icon mobile-only"
                onClick={() => setIsSidebarOpen(true)}
                title="Open sidebar"
                aria-label="Open sidebar"
              >
                <Menu size={18} />
              </button>
              <button
                className="btn search-button"
                onClick={() => setIsSearchOpen(true)}
                style={{
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--sidebar-bg)',
                  padding: '6px 14px',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderRadius: '8px',
                  width: '100%',
                  maxWidth: '320px',
                  transition: 'all 0.2s',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)'
                }}
              >
                <SearchIcon size={14} />
                <span style={{ flex: 1, textAlign: 'left' }}>Rechercher...</span>
                <div style={{
                  fontSize: '10px',
                  opacity: 0.6,
                  backgroundColor: 'var(--surface-hover)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--border)',
                  fontWeight: 600
                }}>⌘ K</div>
              </button>
            </div>
            <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            </div>
          </header>

          <CommandPalette
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onNavigate={(t) => { setCurrentTable(t); setIsSearchOpen(false); setIsSidebarOpen(false); }}
            currentWorkspace={currentWorkspace}
          />

          <div className="content-body">
            {currentTable === 'dashboard' ? (
              <Dashboard onNavigate={setCurrentTable} />
            ) : currentTable === 'requisition' ? (
              <RequisitionView onNew={() => setCurrentTable('submit_requisition')} />
            ) : currentTable === 'submit_requisition' ? (
              <SubmitRequisition onBack={() => setCurrentTable('requisition')} />
            ) : currentTable && (
              <DataTable
                key={currentTable}
                tableName={currentTable}
                onEdit={handleEdit}
                onCreate={handleCreate}
              />
            )}

            {isFormOpen && (
              <EntityForm
                tableName={formTableName || currentTable}
                entity={editingEntity}
                initialData={formInitialData}
                lockedFields={lockedFields}
                upsertStock={upsertStock}
                onClose={() => {
                  setIsFormOpen(false);
                  setFormTableName(null);
                  setFormInitialData(null);
                  setLockedFields([]);
                  setUpsertStock(false);
                }}
                onSave={handleSave}
              />
            )}
          </div>
        </main>
      </div>
    )
  );
}

export default App;
