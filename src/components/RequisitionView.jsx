import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { X, Loader2, Search, ChevronRight, Package } from 'lucide-react';

const TABS = [
    { key: 'En Attente', label: 'Réquisitions', color: '#f5a623' },
    { key: 'Approuvé', label: 'Approuvés', color: '#27ae60' },
    { key: 'Rejeté', label: 'Rejetés', color: '#eb5757' },
];

const etatColors = {
    'En Attente': { bg: 'rgba(255, 183, 77, 0.15)', color: '#f5a623' },
    'Approuvé': { bg: 'rgba(39, 174, 96, 0.15)', color: '#27ae60' },
    'Rejeté': { bg: 'rgba(235, 87, 87, 0.15)', color: '#eb5757' },
};

const RequisitionView = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('En Attente');
    const [selectedReq, setSelectedReq] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: rows, error } = await supabase.from('requisition').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            setData(rows || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
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

    const handleUpdateEtat = async (id, newEtat) => {
        try {
            const { error } = await supabase.from('requisition').update({ etat: newEtat }).eq('id', id);
            if (error) throw error;
            setData(prev => prev.map(item => item.id === id ? { ...item, etat: newEtat } : item));
            if (selectedReq?.id === id) setSelectedReq(prev => ({ ...prev, etat: newEtat }));
        } catch (e) {
            alert('Erreur: ' + e.message);
        }
    };

    const handleToggle = async (id, field, currentValue) => {
        try {
            const { error } = await supabase.from('requisition').update({ [field]: !currentValue }).eq('id', id);
            if (error) throw error;
            setData(prev => prev.map(item => item.id === id ? { ...item, [field]: !currentValue } : item));
            if (selectedReq?.id === id) setSelectedReq(prev => ({ ...prev, [field]: !currentValue }));
        } catch (e) {
            alert('Erreur: ' + e.message);
        }
    };

    const filtered = data
        .filter(item => item.etat === activeTab)
        .filter(item => {
            if (!searchTerm) return true;
            const s = searchTerm.toLowerCase();
            return (item.personnel || '').toLowerCase().includes(s) ||
                String(item.id).includes(s) ||
                JSON.stringify(item.article || '').toLowerCase().includes(s);
        });

    const tabCounts = TABS.reduce((acc, t) => {
        acc[t.key] = data.filter(d => d.etat === t.key).length;
        return acc;
    }, {});

    const ToggleSwitch = ({ value, onChange, label }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
                onClick={onChange}
                style={{
                    width: '40px', height: '22px', borderRadius: '11px', border: 'none',
                    backgroundColor: value ? '#27ae60' : 'var(--border)',
                    position: 'relative', cursor: 'pointer',
                    transition: 'background-color 0.3s ease',
                }}
            >
                <div style={{
                    width: '18px', height: '18px', borderRadius: '50%',
                    backgroundColor: 'white', position: 'absolute', top: '2px',
                    left: value ? '20px' : '2px',
                    transition: 'left 0.3s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
            </button>
            <span style={{ fontSize: '13px', color: 'var(--text)' }}>{label}</span>
        </div>
    );

    return (
        <div style={{ padding: '20px' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', backgroundColor: 'var(--sidebar-bg)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            flex: 1, padding: '10px 16px', borderRadius: '6px', border: 'none',
                            backgroundColor: activeTab === tab.key ? 'var(--background)' : 'transparent',
                            color: activeTab === tab.key ? tab.color : 'var(--text-muted)',
                            fontWeight: activeTab === tab.key ? 700 : 500,
                            fontSize: '13px', cursor: 'pointer',
                            boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                        }}
                    >
                        {tab.label}
                        <span style={{
                            backgroundColor: activeTab === tab.key ? etatColors[tab.key].bg : 'var(--border)',
                            color: activeTab === tab.key ? tab.color : 'var(--text-muted)',
                            padding: '1px 7px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                        }}>
                            {tabCounts[tab.key] || 0}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                    type="text"
                    placeholder="Rechercher une réquisition..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{
                        width: '100%', padding: '8px 12px 8px 32px', border: '1px solid var(--border)',
                        borderRadius: '6px', fontSize: '13px', backgroundColor: 'var(--sidebar-bg)',
                        color: 'var(--text)', outline: 'none',
                    }}
                />
            </div>

            {/* Cards list */}
            {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 size={24} className="animate-spin" /></div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '14px' }}>
                    Aucune réquisition {activeTab === 'En Attente' ? 'en attente' : activeTab === 'Approuvé' ? 'approuvée' : 'rejetée'}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {filtered.map(item => {
                        const articles = parseArticles(item.article);
                        return (
                            <div
                                key={item.id}
                                onClick={() => setSelectedReq(item)}
                                style={{
                                    padding: '14px 16px',
                                    backgroundColor: 'var(--background)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'box-shadow 0.2s, border-color 0.2s',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = etatColors[activeTab].color; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}
                            >
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>#{item.id}</span>
                                        <span style={{ fontSize: '13px', color: 'var(--text)' }}>{item.personnel || '—'}</span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            {item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {articles.map((art, i) => (
                                            <span key={i} style={{
                                                padding: '2px 8px', borderRadius: '4px', fontSize: '12px',
                                                backgroundColor: 'var(--sidebar-bg)',
                                                border: '1px solid var(--border)',
                                                color: 'var(--text-muted)',
                                            }}>
                                                {art.nom || art.name || `Article ${i + 1}`} ×{art.quantite || 1} — {art.presentation || ''}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {activeTab === 'Approuvé' && (
                                        <div style={{ display: 'flex', gap: '12px' }} onClick={e => e.stopPropagation()}>
                                            <ToggleSwitch value={item.proforma} onChange={() => handleToggle(item.id, 'proforma', item.proforma)} label="Proforma" />
                                            <ToggleSwitch value={item.livraison} onChange={() => handleToggle(item.id, 'livraison', item.livraison)} label="Livraison" />
                                        </div>
                                    )}
                                    <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            {selectedReq && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }} onClick={() => setSelectedReq(null)}>
                    <div onClick={e => e.stopPropagation()} style={{ backgroundColor: 'var(--background)', width: '100%', maxWidth: '600px', borderRadius: '10px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Réquisition #{selectedReq.id}</h2>
                            <button className="btn-icon" onClick={() => setSelectedReq(null)}><X size={18} /></button>
                        </div>

                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {/* Meta */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Personnel</div>
                                    <div style={{ fontSize: '14px', color: 'var(--text)' }}>{selectedReq.personnel || '—'}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Date</div>
                                    <div style={{ fontSize: '14px', color: 'var(--text)' }}>
                                        {selectedReq.created_at ? new Date(selectedReq.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                                    </div>
                                </div>
                            </div>

                            {/* Etat switcher */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>Statut</div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {TABS.map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => handleUpdateEtat(selectedReq.id, tab.key)}
                                            style={{
                                                padding: '8px 16px', borderRadius: '20px',
                                                border: selectedReq.etat === tab.key ? '2px solid ' + tab.color : '1px solid var(--border)',
                                                backgroundColor: selectedReq.etat === tab.key ? etatColors[tab.key].bg : 'transparent',
                                                color: selectedReq.etat === tab.key ? tab.color : 'var(--text-muted)',
                                                fontWeight: 600, fontSize: '13px', cursor: 'pointer',
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Proforma / Livraison switches — always visible in detail */}
                            {selectedReq.etat === 'Approuvé' && (
                                <div style={{ marginBottom: '24px', display: 'flex', gap: '24px', padding: '14px 16px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                                    <ToggleSwitch value={selectedReq.proforma} onChange={() => handleToggle(selectedReq.id, 'proforma', selectedReq.proforma)} label="Proforma" />
                                    <ToggleSwitch value={selectedReq.livraison} onChange={() => handleToggle(selectedReq.id, 'livraison', selectedReq.livraison)} label="Livraison" />
                                </div>
                            )}

                            {/* Articles */}
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                                    Articles ({parseArticles(selectedReq.article).length})
                                </div>
                                {parseArticles(selectedReq.article).length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {parseArticles(selectedReq.article).map((art, i) => (
                                            <div key={i} style={{
                                                padding: '14px 16px',
                                                backgroundColor: 'var(--sidebar-bg)',
                                                borderRadius: '8px',
                                                border: '1px solid var(--border)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{
                                                        width: '32px', height: '32px', borderRadius: '6px',
                                                        backgroundColor: etatColors[selectedReq.etat]?.bg || etatColors['En Attente'].bg,
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        <Package size={16} style={{ color: etatColors[selectedReq.etat]?.color || etatColors['En Attente'].color }} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text)' }}>
                                                            {art.nom || art.name || art.Nom || `Article ${i + 1}`}
                                                        </div>
                                                        {art.description && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{art.description}</div>}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                                                        ×{art.quantite || art.qty || art.quantity || 1}
                                                    </div>
                                                    {art.presentation && (
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{art.presentation}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', backgroundColor: 'var(--sidebar-bg)', borderRadius: '6px' }}>
                                        Aucun article
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RequisitionView;
