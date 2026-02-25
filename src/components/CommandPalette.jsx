import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import {
    Search, X, Package, Users, User, Database, TrendingUp,
    ClipboardList, Clock, ArrowRight, Hash, Calendar,
    PillBottle, Eye, History, BarChart3, FileText
} from 'lucide-react';

const CommandPalette = ({ isOpen, onClose, onNavigate, currentWorkspace }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const debounceRef = useRef(null);
    const resultsRef = useRef(null);

    // Reset on open
    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e) => {
            if (e.key === 'Escape') { onClose(); return; }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(i => Math.min(i + 1, results.length - 1));
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(i => Math.max(i - 1, 0));
            }
            if (e.key === 'Enter' && results[selectedIndex]) {
                executeAction(results[selectedIndex]);
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [isOpen, results, selectedIndex]);

    // Scroll selected into view
    useEffect(() => {
        if (resultsRef.current) {
            const el = resultsRef.current.children[selectedIndex];
            if (el) el.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    const executeAction = (result) => {
        if (result.action) {
            result.action();
            onClose();
        }
    };

    const searchAll = useCallback(async (q) => {
        if (!q || q.length < 2) {
            // Show quick navigation when no query
            setResults(getQuickNav());
            return;
        }
        setLoading(true);
        setSelectedIndex(0);

        const allResults = [];
        const term = q.trim();
        const ilike = `%${term}%`;

        // Helper: check if a table belongs to the current workspace
        const wsTables = currentWorkspace?.tables || [];
        const has = (t) => wsTables.includes(t);

        // Helper: filter action buttons to only link to tables in the workspace
        const filterActions = (actions) => actions.filter(a => {
            // Extract target table from the fn — we tag each action with a _table field
            return !a._table || has(a._table);
        });

        try {
            // 1. Search tables (navigation)
            const matchedTables = wsTables.filter(t =>
                t.toLowerCase().includes(term.toLowerCase()) &&
                !(currentWorkspace?.inactiveTables || []).includes(t)
            );
            matchedTables.forEach(t => {
                allResults.push({
                    type: 'navigation',
                    icon: getTableIcon(t),
                    title: formatTableName(t),
                    subtitle: 'Aller à la page',
                    category: 'Navigation',
                    action: () => onNavigate(t),
                    actions: []
                });
            });

            // 2. Search medicaments (only if 'medicaments' is in workspace)
            if (has('medicaments')) {
                const { data: meds } = await supabase
                    .from('medicaments')
                    .select('id, Nom, Nom_generique, Type, description')
                    .or(`Nom.ilike.${ilike},Nom_generique.ilike.${ilike},description.ilike.${ilike}`)
                    .limit(5);

                if (meds?.length) {
                    meds.forEach(m => {
                        allResults.push({
                            type: 'medicament',
                            icon: <Package size={16} style={{ color: '#10b981' }} />,
                            title: m.Nom || m.id,
                            subtitle: [m.Type, m.Nom_generique].filter(Boolean).join(' · '),
                            category: 'Médicaments',
                            action: () => onNavigate('medicaments'),
                            actions: filterActions([
                                { label: 'Stock', icon: <Database size={12} />, color: '#6366f1', fn: () => onNavigate('stock'), _table: 'stock' },
                                { label: 'Sorties', icon: <TrendingUp size={12} />, color: '#f59e0b', fn: () => onNavigate('sorties'), _table: 'sorties' },
                                { label: 'Voir fiche', icon: <Eye size={12} />, color: '#2383e2', fn: () => onNavigate('medicaments'), _table: 'medicaments' },
                            ])
                        });
                    });
                }
            }

            // 3. Search patients (only if 'patients' is in workspace)
            if (has('patients')) {
                const { data: patients } = await supabase
                    .from('patients')
                    .select('id, nom, prenom, sexe, telephone')
                    .or(`nom.ilike.${ilike},prenom.ilike.${ilike},telephone.ilike.${ilike}`)
                    .limit(5);

                if (patients?.length) {
                    patients.forEach(p => {
                        const fullName = `${p.prenom || ''} ${p.nom || ''}`.trim();
                        allResults.push({
                            type: 'patient',
                            icon: <Users size={16} style={{ color: '#8b5cf6' }} />,
                            title: fullName || p.id,
                            subtitle: [p.sexe, p.telephone].filter(Boolean).join(' · '),
                            category: 'Patients',
                            action: () => onNavigate('patients'),
                            actions: filterActions([
                                { label: 'Dossier', icon: <FileText size={12} />, color: '#8b5cf6', fn: () => onNavigate('patients'), _table: 'patients' },
                                { label: 'Sorties', icon: <TrendingUp size={12} />, color: '#f59e0b', fn: () => onNavigate('sorties'), _table: 'sorties' },
                            ])
                        });
                    });
                }
            }

            // 4. Search personnel (only if 'personnel' is in workspace)
            if (has('personnel')) {
                const { data: personnel } = await supabase
                    .from('personnel')
                    .select('id, Nom, Prenom, Poste, Mail')
                    .or(`Nom.ilike.${ilike},Prenom.ilike.${ilike},Mail.ilike.${ilike},Poste.ilike.${ilike}`)
                    .limit(5);

                if (personnel?.length) {
                    personnel.forEach(p => {
                        const fullName = `${p.Prenom || ''} ${p.Nom || ''}`.trim();
                        allResults.push({
                            type: 'personnel',
                            icon: <User size={16} style={{ color: '#0ea5e9' }} />,
                            title: fullName || p.id,
                            subtitle: [p.Poste, p.Mail].filter(Boolean).join(' · '),
                            category: 'Personnel',
                            action: () => onNavigate('personnel'),
                            actions: filterActions([
                                { label: 'Profil', icon: <User size={12} />, color: '#0ea5e9', fn: () => onNavigate('personnel'), _table: 'personnel' },
                                { label: 'Timesheet', icon: <Clock size={12} />, color: '#10b981', fn: () => onNavigate('timesheet'), _table: 'timesheet' },
                            ])
                        });
                    });
                }
            }

            // 5. Search requisitions (only if 'requisition' is in workspace)
            if (has('requisition')) {
                const { data: reqs } = await supabase
                    .from('requisition')
                    .select('id, personnel, etat, created_at')
                    .or(`personnel.ilike.${ilike},etat.ilike.${ilike}`)
                    .limit(5);

                if (reqs?.length) {
                    reqs.forEach(r => {
                        allResults.push({
                            type: 'requisition',
                            icon: <ClipboardList size={16} style={{ color: '#f59e0b' }} />,
                            title: `Réquisition #${r.id?.substring(0, 8) || ''}`,
                            subtitle: [r.personnel, r.etat, r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : null].filter(Boolean).join(' · '),
                            category: 'Réquisitions',
                            action: () => onNavigate('requisition'),
                            actions: filterActions([
                                { label: 'Voir', icon: <Eye size={12} />, color: '#f59e0b', fn: () => onNavigate('requisition'), _table: 'requisition' },
                            ])
                        });
                    });
                }
            }

            // 6. Search sorties (only if 'sorties' is in workspace)
            if (has('sorties')) {
                const { data: sorties } = await supabase
                    .from('sorties')
                    .select('id, date_sortie, service, patient_id')
                    .or(`service.ilike.${ilike}`)
                    .limit(5);

                if (sorties?.length) {
                    sorties.forEach(s => {
                        allResults.push({
                            type: 'sortie',
                            icon: <TrendingUp size={16} style={{ color: '#ef4444' }} />,
                            title: `Sortie ${s.date_sortie ? new Date(s.date_sortie).toLocaleDateString('fr-FR') : s.id?.substring(0, 8)}`,
                            subtitle: s.service || 'Pharmacie',
                            category: 'Sorties',
                            action: () => onNavigate('sorties'),
                            actions: filterActions([
                                { label: 'Détail', icon: <Eye size={12} />, color: '#ef4444', fn: () => onNavigate('sorties'), _table: 'sorties' },
                            ])
                        });
                    });
                }
            }

            // 7. Search stock items (only if 'stock' is in workspace)
            if (has('stock')) {
                const { data: stockItems } = await supabase
                    .from('stock')
                    .select('id, quantite, prix_vente, medicaments:medicaments_id(Nom)')
                    .limit(50);

                if (stockItems?.length) {
                    const matchedStock = stockItems.filter(s =>
                        s.medicaments?.Nom?.toLowerCase().includes(term.toLowerCase())
                    ).slice(0, 5);
                    matchedStock.forEach(s => {
                        const isLow = s.quantite < 20;
                        allResults.push({
                            type: 'stock',
                            icon: <Database size={16} style={{ color: isLow ? '#ef4444' : '#6366f1' }} />,
                            title: s.medicaments?.Nom || `Stock #${s.id}`,
                            subtitle: `Qté: ${s.quantite}${isLow ? ' ⚠ Bas' : ''} · ${s.prix_vente || 0} HTG`,
                            category: 'Stock',
                            action: () => onNavigate('stock'),
                            actions: filterActions([
                                { label: 'Stock', icon: <BarChart3 size={12} />, color: '#6366f1', fn: () => onNavigate('stock'), _table: 'stock' },
                                { label: 'Médicament', icon: <Package size={12} />, color: '#10b981', fn: () => onNavigate('medicaments'), _table: 'medicaments' },
                            ])
                        });
                    });
                }
            }

            // 8. Search timesheet (only if 'timesheet' is in workspace)
            if (has('timesheet')) {
                const { data: timesheets } = await supabase
                    .from('timesheet')
                    .select('id, personnel_id, date, activite, heures')
                    .or(`activite.ilike.${ilike}`)
                    .limit(5);

                if (timesheets?.length) {
                    timesheets.forEach(t => {
                        allResults.push({
                            type: 'timesheet',
                            icon: <Clock size={16} style={{ color: '#10b981' }} />,
                            title: t.activite || `Timesheet #${t.id?.substring(0, 8)}`,
                            subtitle: [t.date ? new Date(t.date).toLocaleDateString('fr-FR') : null, t.heures ? `${t.heures}h` : null].filter(Boolean).join(' · '),
                            category: 'Timesheet',
                            action: () => onNavigate('timesheet'),
                            actions: []
                        });
                    });
                }
            }

        } catch (err) {
            console.error('Search error:', err);
        }

        if (allResults.length === 0) {
            allResults.push({
                type: 'empty',
                icon: <Search size={16} style={{ color: 'var(--text-muted)' }} />,
                title: 'Aucun résultat trouvé',
                subtitle: `Aucune correspondance pour "${term}"`,
                category: '',
                action: null,
                actions: []
            });
        }

        setResults(allResults);
        setLoading(false);
    }, [currentWorkspace, onNavigate]);

    const getQuickNav = () => {
        const tables = (currentWorkspace?.tables || []).filter(t =>
            !(currentWorkspace?.inactiveTables || []).includes(t)
        );
        return tables.map(t => ({
            type: 'navigation',
            icon: getTableIcon(t),
            title: formatTableName(t),
            subtitle: 'Aller à la page',
            category: 'Navigation rapide',
            action: () => onNavigate(t),
            actions: []
        }));
    };

    const handleInput = (val) => {
        setQuery(val);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => searchAll(val), 300);
    };

    useEffect(() => {
        if (isOpen && query === '') {
            setResults(getQuickNav());
        }
    }, [isOpen, currentWorkspace]);

    if (!isOpen) return null;

    // Group results by category
    const grouped = {};
    results.forEach(r => {
        const cat = r.category || 'Autres';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(r);
    });

    let flatIndex = 0;

    return (
        <div
            className="command-palette"
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                backgroundColor: 'rgba(0,0,0,0.45)',
                backdropFilter: 'blur(4px)',
                zIndex: 2000,
                padding: '12vh 20px 20px',
                display: 'flex', justifyContent: 'center', alignItems: 'flex-start'
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    backgroundColor: 'var(--background)',
                    width: '100%', maxWidth: '640px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 60px -10px rgba(0,0,0,0.25), 0 0 0 1px var(--border)',
                    display: 'flex', flexDirection: 'column',
                    maxHeight: '70vh',
                    animation: 'paletteIn 0.15s ease-out'
                }}
            >
                {/* Search input */}
                <div style={{
                    padding: '14px 18px',
                    display: 'flex', alignItems: 'center', gap: '12px',
                    borderBottom: '1px solid var(--border)'
                }}>
                    <Search size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <input
                        ref={inputRef}
                        autoFocus
                        value={query}
                        onChange={(e) => handleInput(e.target.value)}
                        placeholder="Rechercher un médicament, patient, personnel..."
                        style={{
                            border: 'none', flex: 1, fontSize: '15px',
                            outline: 'none', background: 'transparent',
                            color: 'var(--text)',
                            fontFamily: 'inherit'
                        }}
                    />
                    {query && (
                        <button
                            onClick={() => { setQuery(''); setResults(getQuickNav()); }}
                            style={{
                                background: 'var(--surface-hover)',
                                border: 'none', borderRadius: '4px',
                                width: '22px', height: '22px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'var(--text-muted)'
                            }}
                        >
                            <X size={12} />
                        </button>
                    )}
                    {loading && (
                        <div style={{
                            width: '16px', height: '16px',
                            border: '2px solid var(--border)',
                            borderTopColor: 'var(--primary)',
                            borderRadius: '50%',
                            animation: 'spin 0.6s linear infinite'
                        }} />
                    )}
                </div>

                {/* Results */}
                <div ref={resultsRef} style={{ overflowY: 'auto', flex: 1 }}>
                    {Object.entries(grouped).map(([category, items]) => (
                        <div key={category}>
                            <div style={{
                                padding: '10px 18px 4px',
                                fontSize: '11px',
                                fontWeight: 600,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                {category}
                            </div>
                            {items.map((result) => {
                                const idx = flatIndex++;
                                const isSelected = idx === selectedIndex;
                                return (
                                    <div
                                        key={`${result.type}-${result.title}-${idx}`}
                                        onClick={() => executeAction(result)}
                                        onMouseEnter={() => setSelectedIndex(idx)}
                                        style={{
                                            padding: '10px 18px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            cursor: result.action ? 'pointer' : 'default',
                                            backgroundColor: isSelected ? 'var(--surface-hover)' : 'transparent',
                                            transition: 'background-color 0.1s'
                                        }}
                                    >
                                        {/* Icon */}
                                        <div style={{
                                            width: '32px', height: '32px',
                                            borderRadius: '8px',
                                            backgroundColor: 'var(--sidebar-bg)',
                                            border: '1px solid var(--border)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {result.icon}
                                        </div>

                                        {/* Text */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                fontSize: '14px', fontWeight: 500,
                                                color: 'var(--text)',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                                            }}>
                                                {result.title}
                                            </div>
                                            {result.subtitle && (
                                                <div style={{
                                                    fontSize: '12px', color: 'var(--text-muted)',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                    marginTop: '1px'
                                                }}>
                                                    {result.subtitle}
                                                </div>
                                            )}
                                        </div>

                                        {/* Action buttons */}
                                        {result.actions?.length > 0 && (
                                            <div style={{
                                                display: 'flex', gap: '4px', flexShrink: 0
                                            }}>
                                                {result.actions.map((act, ai) => (
                                                    <button
                                                        key={ai}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            act.fn();
                                                            onClose();
                                                        }}
                                                        style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            border: `1px solid ${act.color}30`,
                                                            backgroundColor: `${act.color}12`,
                                                            color: act.color,
                                                            fontSize: '11px',
                                                            fontWeight: 500,
                                                            cursor: 'pointer',
                                                            whiteSpace: 'nowrap',
                                                            transition: 'all 0.15s',
                                                            fontFamily: 'inherit'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.backgroundColor = `${act.color}25`;
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.backgroundColor = `${act.color}12`;
                                                        }}
                                                    >
                                                        {act.icon}
                                                        {act.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Arrow for nav items */}
                                        {result.type === 'navigation' && (
                                            <ArrowRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '8px 18px',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <kbd style={kbdStyle}>↑↓</kbd> Naviguer
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <kbd style={kbdStyle}>↵</kbd> Ouvrir
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <kbd style={kbdStyle}>Esc</kbd> Fermer
                    </span>
                </div>
            </div>

            {/* Animations */}
            <style>{`
                @keyframes paletteIn {
                    from { opacity: 0; transform: scale(0.98) translateY(-8px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

const kbdStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1px 5px',
    borderRadius: '3px',
    border: '1px solid var(--border)',
    backgroundColor: 'var(--sidebar-bg)',
    fontSize: '10px',
    fontWeight: 600,
    fontFamily: 'inherit',
    minWidth: '18px'
};

function getTableIcon(table) {
    const icons = {
        medicaments: <Package size={16} style={{ color: '#10b981' }} />,
        stock: <Database size={16} style={{ color: '#6366f1' }} />,
        patients: <Users size={16} style={{ color: '#8b5cf6' }} />,
        personnel: <User size={16} style={{ color: '#0ea5e9' }} />,
        timesheet: <Clock size={16} style={{ color: '#10b981' }} />,
        sorties: <TrendingUp size={16} style={{ color: '#ef4444' }} />,
        requisition: <ClipboardList size={16} style={{ color: '#f59e0b' }} />,
    };
    return icons[table] || <Database size={16} style={{ color: 'var(--text-muted)' }} />;
}

function formatTableName(table) {
    const labels = {
        medicaments: 'Médicaments',
        stock: 'Stock',
        patients: 'Patients',
        personnel: 'Personnel',
        timesheet: 'Timesheet',
        sorties: 'Sorties',
        requisition: 'Réquisitions',
        ordonnances: 'Ordonnances',
        rapport_temps: 'Rapport de temps',
        contrats: 'Contrats',
        conges: 'Congés',
        evaluations: 'Évaluations',
        formations: 'Formations',
        decaissement: 'Décaissement',
        achats: 'Achats',
        paies: 'Paies',
    };
    return labels[table] || table.charAt(0).toUpperCase() + table.slice(1);
}

export default CommandPalette;
