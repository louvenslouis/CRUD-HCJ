import React from 'react';
import {
    Plus,
    Settings,
    Database,
    User,
    Users,
    Package,
    Clock,
    TrendingUp,
    FileText,
    ChevronRight,
    ChevronDown
} from 'lucide-react';

const Sidebar = ({ tables, inactiveTables = [], activeTable, onTableChange, isOpen, toggleSidebar, width = 240, collapsed = false }) => {
    const tableIcons = {
        medicaments: <Package size={18} />,
        stock: <Database size={18} />,
        patients: <Users size={18} />,
        personnel: <User size={18} />,
        timesheet: <Clock size={18} />,
        ordonnances: <FileText size={18} />,
        sorties: <TrendingUp size={18} />
    };

    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`} style={{ width: collapsed ? 0 : width, minWidth: collapsed ? 0 : width, overflow: 'hidden', transition: 'width 0.2s ease, min-width 0.2s ease', padding: collapsed ? 0 : undefined }}>
            <div className="sidebar-header">
                <div style={{ backgroundColor: '#ff5f56', width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 'bold' }}>H</div>
                <span>Hopital de Juvenat</span>
                <ChevronDown size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
            </div>

            <div className="sidebar-nav">
                <div
                    className={`nav-item ${activeTable === 'dashboard' ? 'active' : ''}`}
                    onClick={() => onTableChange('dashboard')}
                    style={{ marginBottom: '8px' }}
                >
                    <TrendingUp size={18} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>Dashboard</span>
                </div>

                <div style={{ padding: '12px 14px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Databases
                </div>
                {tables.map(table => {
                    const isInactive = inactiveTables.includes(table);
                    return (
                        <div
                            key={table}
                            className={`nav-item ${activeTable === table ? 'active' : ''} ${isInactive ? 'inactive' : ''}`}
                            onClick={() => !isInactive && onTableChange(table)}
                            style={isInactive ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                        >
                            {tableIcons[table] || <Database size={18} />}
                            <span style={{ fontSize: 14, flex: 1 }}>{table.charAt(0).toUpperCase() + table.slice(1)}</span>
                            {isInactive && <span style={{ fontSize: '9px', fontWeight: 600, backgroundColor: 'var(--surface-hover)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>SOON</span>}
                        </div>
                    );
                })}

                <div style={{ marginTop: '20px', padding: '0 14px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Workspaces
                </div>
                <div className="nav-item">
                    <Settings size={18} />
                    <span>Settings & Members</span>
                </div>
            </div>

            <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                <Plus size={16} style={{ marginRight: '8px' }} />
                New Page
            </div>
        </div>
    );
};

export default Sidebar;
