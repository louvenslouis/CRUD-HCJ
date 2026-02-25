import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { X, Save, Loader2, Maximize2, MoreHorizontal } from 'lucide-react';

const EntityForm = ({ tableName, entity, initialData, lockedFields = [], upsertStock = false, onClose, onSave }) => {
    const tableTemplates = {
        stock: ['medicaments_id', 'institution_id', 'quantite', 'prix_vente'],
        patients: ['prenom', 'nom', 'date_naissance', 'sexe', 'telephone'],
        medicaments: ['Nom', 'description', 'Type', 'barcode', 'Nom_generique', 'Pharmacie'],
        personnel: ['id', 'Nom', 'Prenom', 'role', 'Function', 'service', 'Mail', 'Phone'],
        timesheet: ['id_employe', 'activites', 'date', 'nombre_heure'],
        decaissement: ['date', 'beneficiaire', 'motif', 'detail', 'montant', 'devise', 'montant_lettres']
    };

    const convertAmountToFrenchWords = (amount, currency) => {
        if (!amount || isNaN(amount)) return '';

        const units = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
        const teens = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
        const tens = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];

        const formatGroup = (n, isLastGroup = false) => {
            let res = '';
            const h = Math.floor(n / 100);
            const r = n % 100;
            const t = Math.floor(r / 10);
            const u = r % 10;

            if (h > 0) {
                if (h > 1) res += units[h] + ' ';
                res += 'cent';
                if (h > 1 && r === 0 && isLastGroup) res += 's';
                if (r > 0) res += ' ';
            }

            if (r > 0) {
                if (r < 10) {
                    res += units[r];
                } else if (r < 20) {
                    res += teens[r - 10];
                } else {
                    const is70s = t === 7;
                    const is90s = t === 9;
                    const baseTen = (is70s || is90s) ? t - 1 : t;
                    const baseUnit = (is70s || is90s) ? u + 10 : u;

                    res += tens[baseTen];

                    if (baseUnit === 1 || baseUnit === 11) {
                        res += ' et ';
                    } else if (baseUnit > 0) {
                        res += '-';
                    }

                    if (baseUnit < 10) {
                        if (baseUnit > 0) res += units[baseUnit];
                        if (r === 80 && isLastGroup) res += 's';
                    } else {
                        res += teens[baseUnit - 10];
                    }
                }
            }
            return res.trim();
        };

        const convertInteger = (n) => {
            if (n === 0) return 'zéro';
            let parts = [];
            const billion = Math.floor(n / 1000000000);
            const million = Math.floor((n % 1000000000) / 1000000);
            const thousand = Math.floor((n % 1000000) / 1000);
            const remainder = Math.floor(n % 1000);

            if (billion > 0) parts.push(formatGroup(billion) + ' milliard' + (billion > 1 ? 's' : ''));
            if (million > 0) parts.push(formatGroup(million) + ' million' + (million > 1 ? 's' : ''));
            if (thousand > 0) {
                if (thousand === 1) parts.push('mille');
                else parts.push(formatGroup(thousand) + ' mille');
            }
            if (remainder > 0) parts.push(formatGroup(remainder, true));

            return parts.join(' ');
        };

        const intPart = Math.floor(amount);
        const decPart = Math.round((amount - intPart) * 100);

        let result = convertInteger(intPart);
        
        // Currency handling
        const isGourdes = currency === 'Gourdes';
        const mainCurrency = isGourdes ? 'Gourde' : 'Dollar américain';
        const subCurrency = isGourdes ? 'centime' : 'cent';

        result += ' ' + mainCurrency + (intPart > 1 ? 's' : '');
        
        if (decPart > 0) {
            result += ' et ' + convertInteger(decPart) + ' ' + subCurrency + (decPart > 1 ? 's' : '');
        }

        return result.charAt(0).toUpperCase() + result.slice(1);
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
    const deviseOptions = ['Gourdes', 'Dollars américain'];

    const getInitialFields = () => {
        if (entity) {
            return Object.keys(entity).filter(k =>
                k !== 'id' && k !== 'created_at' && k !== 'updated_at' && k !== 'medicament_nom' && k !== 'medicaments'
            );
        }
        return tableTemplates[tableName] || [];
    };

    const [formData, setFormData] = useState(() => {
        const initial = {
            ...(initialData || {}),
            ...(entity || {})
        };
        
        // Default date for decaissement
        if (tableName === 'decaissement' && !initial.date) {
            initial.date = new Date().toISOString().split('T')[0];
        }
        
        return initial;
    });
    const [loading, setLoading] = useState(false);
    const fields = getInitialFields();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        let finalValue = value;
        const numericFields = ['quantite', 'prix_vente', 'nombre_heure', 'institution_id', 'montant'];
        if (numericFields.includes(name)) {
            finalValue = value === '' ? null : (value.includes('.') ? parseFloat(value) : parseInt(value, 10));
        }

        setFormData(prev => {
            const next = {
                ...prev,
                [name]: type === 'checkbox' ? checked : finalValue
            };

            // Auto-generate words for decaissement
            if (tableName === 'decaissement' && (name === 'montant' || name === 'devise')) {
                next.montant_lettres = convertAmountToFrenchWords(next.montant, next.devise);
            }

            return next;
        });
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

    const renderInput = (field) => {
        const isLocked = lockedFields.includes(field);
        const value = formData[field] === null ? '' : formData[field] || '';

        if (tableName === 'medicaments' && field === 'Type') {
            return (
                <select
                    name={field}
                    value={value}
                    onChange={handleChange}
                    disabled={isLocked}
                    style={{
                        border: 'none',
                        padding: '4px 0',
                        fontSize: '14px',
                        backgroundColor: 'transparent',
                        width: '100%',
                        color: 'var(--text)',
                        opacity: isLocked ? 0.7 : 1,
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                    }}
                >
                    <option value="" disabled>Select type...</option>
                    {medicamentTypeOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            );
        }

        if (tableName === 'decaissement' && field === 'devise') {
            return (
                <select
                    name={field}
                    value={value}
                    onChange={handleChange}
                    disabled={isLocked}
                    style={{
                        border: 'none',
                        padding: '4px 0',
                        fontSize: '14px',
                        backgroundColor: 'transparent',
                        width: '100%',
                        color: 'var(--text)',
                        opacity: isLocked ? 0.7 : 1,
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                    }}
                >
                    <option value="" disabled>Choisir la devise...</option>
                    {deviseOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                    ))}
                </select>
            );
        }

        if (field === 'detail' || field === 'description') {
            return (
                <textarea
                    name={field}
                    value={value}
                    onChange={handleChange}
                    disabled={isLocked}
                    rows={3}
                    style={{
                        border: 'none',
                        padding: '4px 0',
                        fontSize: '14px',
                        backgroundColor: 'transparent',
                        width: '100%',
                        color: 'var(--text)',
                        opacity: isLocked ? 0.7 : 1,
                        cursor: isLocked ? 'not-allowed' : 'text',
                        resize: 'none',
                        fontFamily: 'inherit'
                    }}
                    placeholder="Empty"
                />
            );
        }

        if (field === 'date') {
            return (
                <input
                    type="date"
                    name={field}
                    value={value}
                    onChange={handleChange}
                    readOnly={isLocked}
                    style={{
                        border: 'none',
                        padding: '4px 0',
                        fontSize: '14px',
                        opacity: isLocked ? 0.7 : 1,
                        cursor: isLocked ? 'not-allowed' : 'text',
                        backgroundColor: 'transparent',
                        color: 'var(--text)',
                        width: '100%'
                    }}
                />
            );
        }

        return (
            <input
                name={field}
                value={value}
                onChange={handleChange}
                readOnly={isLocked}
                style={{
                    border: 'none',
                    padding: '4px 0',
                    fontSize: '14px',
                    opacity: isLocked ? 0.7 : 1,
                    cursor: isLocked ? 'not-allowed' : 'text',
                    backgroundColor: 'transparent',
                    color: 'var(--text)',
                    width: '100%'
                }}
                placeholder="Empty"
            />
        );
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
                                    {renderInput(field)}
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
