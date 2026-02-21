import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import DataTable from './components/DataTable';
import EntityForm from './components/EntityForm';
import Dashboard from './components/Dashboard';
import { Sun, Moon, Command, Search as SearchIcon } from 'lucide-react';

function App() {
  const tables = ['medicaments', 'stock', 'patients', 'personnel', 'timesheet', 'ordonnances', 'sorties'];
  const inactiveTables = ['timesheet', 'ordonnances'];
  const [currentTable, setCurrentTable] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleEdit = (entity) => {
    setEditingEntity(entity);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setEditingEntity(null);
    setIsFormOpen(true);
  };

  const handleSave = () => {
    setIsFormOpen(false);
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
    <div className="app-container" data-theme={theme}>
      <Sidebar
        tables={tables}
        inactiveTables={inactiveTables}
        activeTable={currentTable}
        onTableChange={(t) => { setCurrentTable(t); setIsSearchOpen(false); }}
        isOpen={isSidebarOpen}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="main-content">
        <header className="header">
          <div className="header-title" style={{ gap: '12px' }}>
            <button
              className="btn"
              onClick={() => setIsSearchOpen(true)}
              style={{ border: 'none', backgroundColor: 'var(--surface-hover)', padding: '4px 12px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Command size={14} />
              <span>Search / Jump to...</span>
              <span style={{ fontSize: '10px', opacity: 0.6, marginLeft: '8px' }}>⌘K</span>
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="btn-icon" onClick={toggleTheme} title="Toggle Theme">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <div style={{ width: '32px', height: '32px', borderRadius: '4px', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
              A
            </div>
          </div>
        </header>

        {isSearchOpen && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, padding: '10vh 20px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ backgroundColor: 'var(--background)', width: '100%', maxWidth: '600px', height: 'fit-content', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
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
              tableName={currentTable}
              entity={editingEntity}
              onClose={() => setIsFormOpen(false)}
              onSave={handleSave}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
