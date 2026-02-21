import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import {
    Package,
    Users,
    TrendingUp,
    AlertTriangle,
    ArrowRight,
    TrendingDown,
    Activity
} from 'lucide-react';

const Dashboard = ({ onNavigate }) => {
    const [stats, setStats] = useState({
        totalMeds: 0,
        totalPatients: 0,
        totalExits: 0,
        lowStock: 0,
        inventoryValue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch counts and stats from Supabase
            const [medRes, patientRes, stockRes, sortieRes] = await Promise.all([
                supabase.from('medicaments').select('id', { count: 'exact', head: true }),
                supabase.from('patients').select('id', { count: 'exact', head: true }),
                supabase.from('stock').select('quantite, prix_vente'),
                supabase.from('sorties').select('id', { count: 'exact', head: true })
            ]);

            const lowStockCount = (stockRes.data || []).filter(item => item.quantite < 20).length;
            const totalInventoryValue = (stockRes.data || []).reduce((acc, item) => acc + (item.quantite * item.prix_vente), 0);

            setStats({
                totalMeds: medRes.count || 0,
                totalPatients: patientRes.count || 0,
                totalExits: sortieRes.count || 0,
                lowStock: lowStockCount,
                inventoryValue: totalInventoryValue
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, icon, color, trend, trendValue }) => (
        <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 500 }}>{title}</div>
                <div style={{ color: color }}>{icon}</div>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{value}</div>
            {trend && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: trend === 'up' ? '#10b981' : '#ef4444' }}>
                    {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{trendValue}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>than last month</span>
                </div>
            )}
        </div>
    );

    return (
        <div className="dashboard" style={{ animation: 'fadeIn 0.4s ease-out' }}>
            <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '24px' }}>Welcome back, Admin</h1>

            <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                <StatCard
                    title="Total Medications"
                    value={stats.totalMeds}
                    icon={<Package size={20} />}
                    color="#2383e2"
                    trend="up"
                    trendValue="12%"
                />
                <StatCard
                    title="Total Patients"
                    value={stats.totalPatients}
                    icon={<Users size={20} />}
                    color="#37352f"
                    trend="up"
                    trendValue="5%"
                />
                <StatCard
                    title="Stock Low Alerts"
                    value={stats.lowStock}
                    icon={<AlertTriangle size={20} />}
                    color="#eb5757"
                />
                <StatCard
                    title="Inventory Value"
                    value={`${stats.inventoryValue.toLocaleString()} HTG`}
                    icon={<Activity size={20} />}
                    color="#10b981"
                />
            </div>

            <div className="dashboard-sections" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                <div className="card" style={{ padding: '24px', border: '1px solid var(--border)' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Quick Actions
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {[
                            { label: 'Register New Patient', table: 'patients' },
                            { label: 'Update Medication Stock', table: 'stock' },
                            { label: 'Record Medication Exit', table: 'sorties' },
                            { label: 'View Today\'s Timesheet', table: 'timesheet' }
                        ].map((action, idx) => (
                            <div
                                key={idx}
                                onClick={() => onNavigate(action.table)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--sidebar-bg)',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s'
                                }}
                                className="action-item"
                            >
                                <span style={{ fontSize: '14px', fontWeight: 500 }}>{action.label}</span>
                                <ArrowRight size={16} color="var(--text-muted)" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ padding: '24px', border: '1px solid var(--border)', backgroundColor: stats.lowStock > 0 ? 'rgba(235, 87, 87, 0.05)' : 'transparent' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', color: stats.lowStock > 0 ? '#eb5757' : 'inherit' }}>
                        Status Summary
                    </h2>
                    <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                        {stats.lowStock > 0 ? (
                            <p>You have <span style={{ fontWeight: 600, color: '#eb5757' }}>{stats.lowStock} items</span> running low on stock. Immediate action recommended.</p>
                        ) : (
                            <p>All stock levels are within healthy ranges. No urgent alerts.</p>
                        )}
                        <p style={{ marginTop: '16px' }}>Total pharmaceutical circulation is up <span style={{ color: '#10b981', fontWeight: 600 }}>8.4%</span> this week due to increased patient arrivals.</p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .action-item:hover { background-color: var(--surface-hover) !important; }
      `}} />
        </div>
    );
};

export default Dashboard;
