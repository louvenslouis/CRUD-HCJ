import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { X, Save, Loader2, Maximize2, MoreHorizontal } from 'lucide-react';

const EntityForm = ({ tableName, entity, initialData, lockedFields = [], upsertStock = false, onClose, onSave }) => {
    const tableTemplates = {
        stock: ['medicaments_id', 'institution_id', 'quantite', 'prix_vente'],
        patients: ['prenom', 'nom', 'date_naissance', 'sexe', 'telephone'],
        medicaments: ['Nom', 'description', 'Type', 'barcode', 'Nom_generique', 'Pharmacie'],
        personnel: ['id', 'Nom', 'Prenom', 'role', 'Function', 'service', 'Mail', 'Phone'],
        timesheet: ['id_employe', 'activites', 'date', 'nombre_heure']
    };
    const medicamentTypeOptions = [
        'Comprimé',
        'Goutte',
        'Matériel médical',
        'Sirop',
        'Soluté',
        'Solution injectable',
        'lotion'
    ];

    const getInitialFields = () => {
        if (entity) {
            return Object.keys(entity).filter(k =>
                k !== 'id' && k !== 'created_at' && k !== 'updated_at' && k !== 'medicament_nom' && k !== 'medicaments'
            );
        }
        return tableTemplates[tableName] || [];
    };

    const [formData, setFormData] = useState(() => ({
        ...(initialData || {}),
        ...(entity || {})
    }));
    const [loading, setLoading] = useState(false);
    const fields = getInitialFields();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = value;
        const numericFields = ['quantite', 'prix_vente', 'nombre_heure', 'institution_id'];
        if (numericFields.includes(name)) {
            finalValue = value === '' ? null : (value.includes('.') ? parseFloat(value) : parseInt(value, 10));
        }
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : finalValue
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const dataToSave = {};
        fields.forEach(f => {
            if (formData[f] !== undefined) dataToSave[f] = formData[f];
        });
        if (tableName === 'stock' && (dataToSave.institution_id === undefined || dataToSave.institution_id === null)) {
            dataToSave.institution_id = 1;
        }

        try {
            let error;
            if (entity && entity.id) {
                const res = await supabase.from(tableName).update(dataToSave).eq('id', entity.id);
                error = res.error;
            } else {
                if (tableName === 'stock' && upsertStock) {
                    const { data: existing, error: existingError } = await supabase
                        .from('stock')
                        .select('id')
                        .eq('medicaments_id', dataToSave.medicaments_id)
                        .eq('institution_id', dataToSave.institution_id)
                        .maybeSingle();
                    if (existingError) throw existingError;
                    if (existing?.id) {
                        const res = await supabase.from('stock').update(dataToSave).eq('id', existing.id);
                        error = res.error;
                    } else {
                        const res = await supabase.from('stock').insert([dataToSave]);
                        error = res.error;
                    }
                } else {
                    const res = await supabase.from(tableName).insert([dataToSave]);
                    error = res.error;
                }
            }
            if (error) throw error;
            onSave();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(55, 53, 47, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="modal-panel entity-form-panel" style={{
                width: '100%',
                maxWidth: '700px',
                backgroundColor: 'var(--background)',
                height: '90vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '3px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}>
                {/* Top Control Bar */}
                <div className="entity-form-topbar" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <div className="entity-form-topbar-left" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <button onClick={onClose} style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                            <ChevronLeft size={20} />
                        </button>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{tableName} / {entity ? entity.id : 'New'}</span>
                    </div>
                    <div className="entity-form-topbar-right" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Edited 2 mins ago</span>
                        <button className="btn" onClick={onClose}>Done</button>
                        <button className="btn-icon"><MoreHorizontal size={18} /></button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="entity-form" style={{ flex: 1, padding: '48px 96px', overflowY: 'auto' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '40px', fontWeight: '700', color: 'var(--text)', border: 'none', width: '100%', marginBottom: '8px' }}>
                            {entity ? `Record ${entity.id}` : 'New Record'}
                        </h1>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', backgroundColor: 'var(--border)' }}>
                        {fields.map(field => (
                            <div key={field} className="entity-form-row" style={{ display: 'flex', backgroundColor: 'var(--background)', padding: '12px 0' }}>
                                <div className="entity-form-label" style={{ width: '160px', color: 'var(--text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                                    {field.replace('_', ' ')}
                                </div>
                                <div className="entity-form-input" style={{ flex: 1 }}>
                                    {tableName === 'medicaments' && field === 'Type' ? (
                                        <select
                                            name={field}
                                            value={formData[field] === null ? '' : formData[field] || ''}
                                            onChange={handleChange}
                                            disabled={lockedFields.includes(field)}
                                            style={{
                                                border: 'none',
                                                padding: '4px 0',
                                                fontSize: '14px',
                                                backgroundColor: 'transparent',
                                                width: '100%',
                                                color: 'var(--text)',
                                                opacity: lockedFields.includes(field) ? 0.7 : 1,
                                                cursor: lockedFields.includes(field) ? 'not-allowed' : 'pointer',
                                            }}
                                        >
                                            <option value="" disabled>
                                                Select type...
                                            </option>
                                            {medicamentTypeOptions.map(option => (
                                                <option key={option} value={option}>
                                                    {option}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            name={field}
                                            value={formData[field] === null ? '' : formData[field] || ''}
                                            onChange={handleChange}
                                            readOnly={lockedFields.includes(field)}
                                            style={{
                                                border: 'none',
                                                padding: '4px 0',
                                                fontSize: '14px',
                                                opacity: lockedFields.includes(field) ? 0.7 : 1,
                                                cursor: lockedFields.includes(field) ? 'not-allowed' : 'text',
                                            }}
                                            placeholder={`Empty`}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '48px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '8px 24px' }}>
                            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Save changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ChevronLeft = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
);

export default EntityForm;
