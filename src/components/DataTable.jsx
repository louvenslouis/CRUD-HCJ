import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Filter,
    ArrowUpDown,
    MoreHorizontal,
    Download,
    X
} from 'lucide-react';

const DataTable = ({ tableName, onEdit, onCreate }) => {
    const [data, setData] = useState([]);
    const [columns, setColumns] = useState([]);
    const [visibleColumns, setVisibleColumns] = useState([]);
    const [showColumnManager, setShowColumnManager] = useState(false);
    const [sortConfig, setSortConfig] = useState(null); // { key, direction: 'asc' | 'desc' }
    const [showSortManager, setShowSortManager] = useState(false);
    const [columnFilters, setColumnFilters] = useState({}); // { col: value }
    const [showFilterManager, setShowFilterManager] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [selectedRequisition, setSelectedRequisition] = useState(null);
    const pageSize = 100;

    // Columns to auto-hide for requisition table
    const hiddenRequisitionCols = ['posted', 'article'];

    useEffect(() => {
        setVisibleColumns([]);
        setSelectedRequisition(null);
        setSortConfig(null);
        setColumnFilters({});
        setPage(0);
    }, [tableName]);

    useEffect(() => {
        fetchData();
    }, [tableName, page]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let query = supabase.from(tableName).select('*', { count: 'exact' });

            if (tableName === 'stock') {
                query = supabase
                    .from('stock')
                    .select(`
            id,
            medicaments:medicaments_id ( Nom ),
            quantite,
            prix_vente,
            created_at
          `, { count: 'exact' });
            }

            const { data: fetchedData, error } = await query
                .range(page * pageSize, (page + 1) * pageSize - 1);

            if (error) throw error;

            if (fetchedData && fetchedData.length > 0) {
                const processedData = fetchedData.map(item => {
                    if (item.medicaments) {
                        const newItem = { ...item, medicament_nom: item.medicaments.Nom };
                        delete newItem.medicaments;
                        return newItem;
                    }
                    return item;
                });
                setData(processedData);
                const cols = Object.keys(processedData[0]);
                setColumns(cols);
                if (visibleColumns.length === 0) {
                    const visible = tableName === 'requisition'
                        ? cols.filter(c => !hiddenRequisitionCols.includes(c))
                        : cols;
                    setVisibleColumns(visible);
                }
            } else {
                setData([]);
                setColumns([]);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExportCSV = () => {
        if (data.length === 0) return;
        const headers = columns.join(',');
        const rows = data.map(item =>
            columns.map(col => `"${String(item[col] || '').replace(/"/g, '""')}"`).join(',')
        ).join('\n');
        const csvContent = `${headers}\n${rows}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${tableName}_export.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this record?')) return;
        try {
            const { error } = await supabase.from(tableName).delete().eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const etatOptions = ['En Attente', 'Rejeté', 'Approuvé'];
    const etatColors = {
        'En Attente': { bg: 'rgba(255, 183, 77, 0.15)', color: '#f5a623' },
        'Approuvé': { bg: 'rgba(39, 174, 96, 0.15)', color: '#27ae60' },
        'Rejeté': { bg: 'rgba(235, 87, 87, 0.15)', color: '#eb5757' }
    };

    const handleUpdateEtat = async (id, newEtat) => {
        try {
            const { error } = await supabase.from('requisition').update({ etat: newEtat }).eq('id', id);
            if (error) throw error;
            setData(data.map(item => item.id === id ? { ...item, etat: newEtat } : item));
            if (selectedRequisition && selectedRequisition.id === id) {
                setSelectedRequisition({ ...selectedRequisition, etat: newEtat });
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const parseArticles = (article) => {
        if (!article) return [];
        try {
            if (typeof article === 'string') return JSON.parse(article);
            if (Array.isArray(article)) return article;
            return [article];
        } catch { return []; }
    };

    const filteredData = data
        .filter(item => {
            // Global search
            const globalMatch = Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            );
            if (!globalMatch) return false;

            // Column filters
            return Object.entries(columnFilters).every(([col, filterVal]) => {
                if (!filterVal) return true;
                return String(item[col] || '').toLowerCase().includes(filterVal.toLowerCase());
            });
        })
        .sort((a, b) => {
            if (!sortConfig) return 0;
            const { key, direction } = sortConfig;
            if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
            if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
            return 0;
        });

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700' }}>{tableName.charAt(0).toUpperCase() + tableName.slice(1)}</h1>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="btn" style={{ border: 'none', padding: '4px 8px' }}>
                        <span style={{ borderBottom: '2px solid var(--text)', paddingBottom: '6px' }}>Table</span>
                    </div>
                    <div className="btn" style={{ border: 'none', padding: '4px 8px', color: 'var(--text-muted)' }}>
                        <span>Board</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '180px',
                                padding: '4px 8px 4px 28px',
                                fontSize: '13px',
                                border: 'none',
                                backgroundColor: 'transparent'
                            }}
                        />
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button className="btn" onClick={() => setShowFilterManager(!showFilterManager)} style={{ border: 'none' }}>
                            <Filter size={14} /> Filter {Object.values(columnFilters).some(v => v) && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)', marginLeft: '4px' }}></span>}
                        </button>
                        {showFilterManager && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, mt: '4px',
                                backgroundColor: 'var(--background)', border: '1px solid var(--border)',
                                borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                zIndex: 100, width: '220px', padding: '8px 0'
                            }}>
                                <div style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                                    Filters
                                    {Object.values(columnFilters).some(v => v) && <span onClick={() => setColumnFilters({})} style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 400 }}>Clear All</span>}
                                </div>
                                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '0 12px' }}>
                                    {columns.map(col => (
                                        <div key={col} style={{ margin: '8px 0' }}>
                                            <div style={{ fontSize: '12px', marginBottom: '4px' }}>{col.replace('_', ' ')}</div>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder={`Filter ${col.replace('_', ' ')}...`}
                                                value={columnFilters[col] || ''}
                                                onChange={(e) => setColumnFilters({ ...columnFilters, [col]: e.target.value })}
                                                style={{ width: '100%', padding: '4px 8px', fontSize: '12px' }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button className="btn" onClick={() => setShowSortManager(!showSortManager)} style={{ border: 'none' }}>
                            <ArrowUpDown size={14} /> Sort {sortConfig && <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--primary)', marginLeft: '4px' }}></span>}
                        </button>
                        {showSortManager && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, mt: '4px',
                                backgroundColor: 'var(--background)', border: '1px solid var(--border)',
                                borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                zIndex: 100, width: '200px', padding: '8px 0'
                            }}>
                                <div style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sort by</div>
                                {columns.map(col => (
                                    <div key={col} style={{ display: 'flex', gap: '4px', padding: '4px 12px' }}>
                                        <span style={{ fontSize: '13px', flex: 1 }}>{col.replace('_', ' ')}</span>
                                        <button
                                            className={`btn-icon ${sortConfig?.key === col && sortConfig?.direction === 'asc' ? 'active' : ''}`}
                                            onClick={() => setSortConfig(sortConfig?.key === col && sortConfig?.direction === 'asc' ? null : { key: col, direction: 'asc' })}
                                            style={{ backgroundColor: sortConfig?.key === col && sortConfig?.direction === 'asc' ? 'var(--surface-hover)' : 'transparent' }}
                                        >
                                            ↑
                                        </button>
                                        <button
                                            className={`btn-icon ${sortConfig?.key === col && sortConfig?.direction === 'desc' ? 'active' : ''}`}
                                            onClick={() => setSortConfig(sortConfig?.key === col && sortConfig?.direction === 'desc' ? null : { key: col, direction: 'desc' })}
                                            style={{ backgroundColor: sortConfig?.key === col && sortConfig?.direction === 'desc' ? 'var(--surface-hover)' : 'transparent' }}
                                        >
                                            ↓
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div style={{ position: 'relative' }}>
                        <button className="btn" onClick={() => setShowColumnManager(!showColumnManager)} style={{ border: 'none' }}>
                            <MoreHorizontal size={14} /> Columns
                        </button>
                        {showColumnManager && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '4px',
                                backgroundColor: 'var(--background)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                zIndex: 100,
                                width: '200px',
                                padding: '8px 0',
                                color: 'var(--text)'
                            }}>
                                <div style={{ padding: '4px 12px', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Visible Columns</div>
                                {columns.map(col => (
                                    <div
                                        key={col}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', cursor: 'pointer' }}
                                        onClick={() => {
                                            if (visibleColumns.includes(col)) {
                                                if (visibleColumns.length > 1) {
                                                    setVisibleColumns(visibleColumns.filter(c => c !== col));
                                                }
                                            } else {
                                                setVisibleColumns([...visibleColumns, col]);
                                            }
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.includes(col)}
                                            readOnly
                                            style={{ cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '13px', color: 'var(--text)' }}>{col.replace(/_/g, ' ')}</span>
                                    </div>
                                ))}
                            </div>

                        )}
                    </div>
                    <button className="btn" onClick={handleExportCSV} style={{ border: 'none' }} title="Export to CSV">
                        <Download size={14} /> Export
                    </button>
                    <button className="btn btn-primary" onClick={onCreate} style={{ padding: '4px 12px', fontSize: '13px' }}>
                        <Plus size={14} /> New
                    </button>
                </div>
            </div>

            <div className="table-container">
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 size={24} className="animate-spin" /></div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                {columns.filter(col => visibleColumns.includes(col)).map(col => (
                                    <th key={col} style={{ color: 'var(--text)' }}>{col.replace(/_/g, ' ').toUpperCase()}</th>
                                ))}
                                <th style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, idx) => (
                                <tr key={item.id || idx} onClick={() => tableName === 'requisition' && setSelectedRequisition(item)} style={tableName === 'requisition' ? { cursor: 'pointer' } : {}}>
                                    {columns.filter(col => visibleColumns.includes(col)).map(col => (
                                        <td key={col} style={{
                                            color: (tableName === 'stock' && col === 'quantite' && item[col] < 20) ? '#eb5757' : 'var(--text)',
                                            fontWeight: (tableName === 'stock' && col === 'quantite' && item[col] < 20) ? 600 : 'inherit'
                                        }}>
                                            {tableName === 'requisition' && col === 'etat' ? (
                                                <span style={{
                                                    padding: '3px 10px',
                                                    borderRadius: '12px',
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                    backgroundColor: (etatColors[item[col]] || etatColors['En Attente']).bg,
                                                    color: (etatColors[item[col]] || etatColors['En Attente']).color,
                                                }}>
                                                    {item[col] || 'En Attente'}
                                                </span>
                                            ) : (
                                                <>{typeof item[col] === 'object' ? JSON.stringify(item[col]) : String(item[col] ?? '')}</>
                                            )}
                                            {tableName === 'stock' && col === 'quantite' && item[col] < 20 && (
                                                <span style={{
                                                    marginLeft: '8px',
                                                    padding: '2px 6px',
                                                    backgroundColor: 'rgba(235, 87, 87, 0.1)',
                                                    color: '#eb5757',
                                                    fontSize: '10px',
                                                    borderRadius: '4px',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}>
                                                    Low Stock
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '4px', opacity: 0.5 }}>
                                            <button className="btn-icon" onClick={() => onEdit(item)}><Edit2 size={14} /></button>
                                            <button className="btn-icon" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '16px', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{filteredData.length} records</span>
                <button className="btn-icon" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft size={16} /></button>
                <button className="btn-icon" onClick={() => setPage(p => p + 1)} disabled={data.length < pageSize}><ChevronRight size={16} /></button>
            </div>

            {/* Requisition Detail Modal */}
            {selectedRequisition && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
                    <div style={{ backgroundColor: 'var(--background)', width: '100%', maxWidth: '600px', borderRadius: '8px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)', overflow: 'hidden', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Réquisition #{selectedRequisition.id}</h2>
                            <button className="btn-icon" onClick={() => setSelectedRequisition(null)}><X size={18} /></button>
                        </div>

                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {/* Meta info */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Personnel</div>
                                    <div style={{ fontSize: '14px', color: 'var(--text)' }}>{selectedRequisition.personnel || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Date</div>
                                    <div style={{ fontSize: '14px', color: 'var(--text)' }}>{selectedRequisition.created_at ? new Date(selectedRequisition.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</div>
                                </div>
                            </div>

                            {/* Etat status switcher */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Statut</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {etatOptions.map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => handleUpdateEtat(selectedRequisition.id, opt)}
                                            style={{
                                                padding: '8px 16px',
                                                borderRadius: '20px',
                                                border: selectedRequisition.etat === opt ? '2px solid ' + etatColors[opt].color : '1px solid var(--border)',
                                                backgroundColor: selectedRequisition.etat === opt ? etatColors[opt].bg : 'transparent',
                                                color: selectedRequisition.etat === opt ? etatColors[opt].color : 'var(--text-muted)',
                                                fontWeight: 600,
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Articles */}
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Articles</div>
                                {parseArticles(selectedRequisition.article).length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {parseArticles(selectedRequisition.article).map((art, i) => (
                                            <div key={i} style={{
                                                padding: '12px 16px',
                                                backgroundColor: 'var(--sidebar-bg)',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>{art.nom || art.name || art.Nom || art.article || `Article ${i + 1}`}</div>
                                                    {art.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{art.description}</div>}
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    {(art.quantite || art.qty || art.quantity) && (
                                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>×{art.quantite || art.qty || art.quantity}</div>
                                                    )}
                                                    {(art.prix || art.price || art.prix_unitaire) && (
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{art.prix || art.price || art.prix_unitaire} HTG</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '6px' }}>Aucun article</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;
