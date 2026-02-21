import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DataTable from './components/DataTable';
import EntityForm from './components/EntityForm';
import Dashboard from './components/Dashboard';
import RequisitionView from './components/RequisitionView';
import { Sun, Moon, Command, Search as SearchIcon, ChevronsLeft, ChevronsRight, Menu } from 'lucide-react';

function App() {
  const tables = ['medicaments', 'stock', 'patients', 'personnel', 'timesheet', 'ordonnances', 'sorties', 'requisition'];
  const inactiveTables = ['timesheet', 'ordonnances'];
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
    <div
      className="app-container"
      data-theme={theme}
      style={{ '--sidebar-live-width': sidebarCollapsed ? '0px' : `${sidebarWidth}px` }}
    >
      <Sidebar
        tables={tables}
        inactiveTables={inactiveTables}
        activeTable={currentTable}
        onTableChange={(t) => { setCurrentTable(t); setIsSearchOpen(false); setIsSidebarOpen(false); }}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        width={sidebarCollapsed ? 0 : sidebarWidth}
        collapsed={sidebarCollapsed}
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
          left: sidebarCollapsed ? 8 : 'calc(var(--sidebar-live-width) - 14px)',
          top: 12,
          zIndex: 1002,
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          border: '1px solid var(--border)',
          backgroundColor: 'var(--background)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          transition: 'left 0.2s ease',
        }}
        className="sidebar-toggle"
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
              style={{ border: 'none', backgroundColor: 'var(--surface-hover)', padding: '4px 12px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Command size={14} />
              <span>Search / Jump to...</span>
              <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '8px' }}>⌘K</span>
            </button>
          </div>
          <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn-icon" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
              A
            </div>
          </div>
        </header>

        {isSearchOpen && (
          <div className="command-palette">
            <div className="command-palette-panel">
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)' }}>
                <SearchIcon size={20} color="var(--text-muted)" />
                <input
                  autoFocus
                  placeholder="Type a table name to jump to..."
                  style={{ border: 'none', flex: 1, fontSize: '16px', outline: 'none' }}
                  onChange={(e) => {
                    const val = e.target.value.toLowerCase();
                    const match = tables.find(t => t.includes(val));
                    if (match && e.key === 'Enter') {
                      setCurrentTable(match);
                      setIsSearchOpen(false);
                    }
                  }}
                  onKeyDown={(e) => {
                    const val = e.target.value.toLowerCase();
                    const match = tables.find(t => t.includes(val));
                    if (match && e.key === 'Enter') {
                      setCurrentTable(match);
                      setIsSearchOpen(false);
                    }
                  }}
                />
              </div>
              <div style={{ padding: '8px 0' }}>
                <div style={{ padding: '8px 16px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Suggested Tables</div>
                {tables.filter(t => !inactiveTables.includes(t)).map(t => (
                  <div
                    key={t}
                    onClick={() => { setCurrentTable(t); setIsSearchOpen(false); }}
                    style={{ padding: '8px 16px', fontSize: '14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}
                    className="nav-item"
                  >
                    <span>{t}</span>
                    <span style={{ fontSize: '12px', opacity: 0.5 }}>Jump to</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="content-body">
          {currentTable === 'dashboard' ? (
            <Dashboard onNavigate={setCurrentTable} />
          ) : currentTable === 'requisition' ? (
            <RequisitionView />
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
  );
}

export default App;
