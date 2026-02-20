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
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const pageSize = 15;

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
                setColumns(Object.keys(processedData[0]));
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

    const filteredData = data.filter(item =>
        Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

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
                    <button className="btn" style={{ border: 'none' }}><Filter size={14} /> Filter</button>
                    <button className="btn" style={{ border: 'none' }}><ArrowUpDown size={14} /> Sort</button>
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
                                {columns.map(col => (
                                    <th key={col}>{col.replace('_', ' ').toUpperCase()}</th>
                                ))}
                                <th style={{ width: '40px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.map((item, idx) => (
                                <tr key={item.id || idx}>
                                    {columns.map(col => (
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
