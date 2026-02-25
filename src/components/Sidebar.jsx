import React, { useState } from 'react';
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
    ChevronDown,
    ClipboardList,
    CreditCard,
    ShoppingCart,
    Wallet,
    Lock,
    Calendar,
    Award,
    BookOpen,
    Briefcase,
    Timer,
    Sun,
    Moon,
    LogOut
} from 'lucide-react';

const Sidebar = ({ workspaces, currentWorkspaceKey, onWorkspaceChange, tables, inactiveTables = [], activeTable, onTableChange, isOpen, toggleSidebar, width = 240, collapsed = false, onLock, user, onLogout, onToggleTheme, theme }) => {
    const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
    const currentWorkspace = workspaces[currentWorkspaceKey];

    const tableIcons = {
        medicaments: <Package size={18} />,
        stock: <Database size={18} />,
        patients: <Users size={18} />,
        personnel: <User size={18} />,
        timesheet: <Clock size={18} />,
        rapport_temps: <Timer size={18} />,
        contrats: <Briefcase size={18} />,
        conges: <Calendar size={18} />,
        evaluations: <Award size={18} />,
        formations: <BookOpen size={18} />,
        ordonnances: <FileText size={18} />,
        sorties: <TrendingUp size={18} />,
        requisition: <ClipboardList size={18} />,
        decaissement: <CreditCard size={18} />,
        achats: <ShoppingCart size={18} />,
        paies: <Wallet size={18} />
    };

    const tableLabels = {
        requisition: 'Requisitions',
        decaissement: 'Demande de décaissement',
        achats: 'Achats',
        paies: 'Paies',
        rapport_temps: 'Rapport de temps',
        contrats: 'Contrats',
        conges: 'Congés',
        evaluations: 'Évaluations',
        formations: 'Formations',
        timesheet: 'Timesheet'
    };

    return (
        <div className={`sidebar ${isOpen ? 'open' : ''}`} style={{ width: collapsed ? 0 : width, minWidth: collapsed ? 0 : width, overflow: 'visible', transition: 'width 0.2s ease, min-width 0.2s ease', padding: collapsed ? 0 : undefined }}>
            <div className="sidebar-header" style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}>
                <div style={{ backgroundColor: currentWorkspace.color, width: 20, height: 20, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                    {currentWorkspace.icon}
                </div>
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, marginRight: '4px' }}>{currentWorkspace.name}</span>
                <ChevronDown size={14} style={{ marginLeft: 'auto', color: 'var(--text-muted)', transform: isWorkspaceMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />

                {isWorkspaceMenuOpen && (
                    <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: '8px',
                        right: '8px',
                        backgroundColor: 'var(--background)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 100,
                        padding: '4px',
                        marginTop: '4px'
                    }}>
                        <div style={{ padding: '8px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Workspaces</div>
                        {Object.entries(workspaces).map(([key, ws]) => (
                            <div
                                key={key}
                                className={`nav-item ${currentWorkspaceKey === key ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onWorkspaceChange(key);
                                    setIsWorkspaceMenuOpen(false);
                                }}
                                style={{ padding: '8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}
                            >
                                <div style={{ backgroundColor: ws.color, width: 18, height: 18, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                                    {ws.icon}
                                </div>
                                <span style={{ fontSize: '13px' }}>{ws.name}</span>
                            </div>
                        ))}
                    </div>
                )}
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
                            <span style={{ fontSize: 14, flex: 1 }}>{tableLabels[table] || table.charAt(0).toUpperCase() + table.slice(1)}</span>
                            {isInactive && <span style={{ fontSize: '9px', fontWeight: 600, backgroundColor: 'var(--surface-hover)', padding: '2px 6px', borderRadius: '4px', color: 'var(--text-muted)' }}>SOON</span>}
                        </div>
                    );
                })}

                <div style={{ marginTop: '20px', padding: '0 14px 4px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Actions
                </div>
                <div className="nav-item">
                    <Settings size={18} />
                    <span>Settings & Members</span>
                </div>
            </div>

            {/* Bottom section: User, Theme/Logout, Lock */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* User row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 0' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={14} />
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {user?.Prenom || ''} {user?.Nom || ''}
                    </span>
                </div>

                {/* Theme + Logout row */}
                <div style={{ display: 'flex', gap: '8px', padding: '4px 0' }}>
                    <div
                        onClick={onToggleTheme}
                        className="nav-item theme-toggle-btn"
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: 13,
                            color: theme === 'light' ? '#6366f1' : '#fbbf24',
                            backgroundColor: theme === 'light' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                            cursor: 'pointer',
                            justifyContent: 'center',
                            border: '1px solid currentColor'
                        }}
                        title={theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                    >
                        {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    </div>
                    <div
                        onClick={onLogout}
                        className="nav-item logout-btn"
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '6px',
                            fontSize: 13,
                            color: '#ffffff',
                            backgroundColor: '#ef4444',
                            cursor: 'pointer',
                            justifyContent: 'center'
                        }}
                        title="Déconnexion"
                    >
                        <LogOut size={16} />
                    </div>
                </div>

                {/* Lock row */}
                <div
                    onClick={onLock}
                    className="nav-item"
                    style={{ padding: '6px 10px', fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                    <Lock size={15} />
                    <span>Verrouiller</span>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
