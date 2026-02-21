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
    Download
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
    const pageSize = 100;

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
                if (visibleColumns.length === 0) setVisibleColumns(cols);
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
                                    <th key={col}>{col.replace('_', ' ').toUpperCase()}</th>
                                ))}
                                <th style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, idx) => (
                                <tr key={item.id || idx}>
                                    {columns.filter(col => visibleColumns.includes(col)).map(col => (
                                        <td key={col} style={{
                                            color: (tableName === 'stock' && col === 'quantite' && item[col] < 20) ? '#eb5757' : 'inherit',
                                            fontWeight: (tableName === 'stock' && col === 'quantite' && item[col] < 20) ? 600 : 'inherit'
                                        }}>
                                            {typeof item[col] === 'object' ? JSON.stringify(item[col]) : String(item[col])}
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
        </div>
    );
};

export default DataTable;
