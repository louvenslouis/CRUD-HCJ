import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { ArrowLeft, Plus, Trash2, Package, Send, Loader2, User, FileText, Check } from 'lucide-react';

const SubmitRequisition = ({ onBack }) => {
    const [personnelId, setPersonnelId] = useState('');
    const [personnelList, setPersonnelList] = useState([]);
    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingPersonnel, setFetchingPersonnel] = useState(true);
    const [success, setSuccess] = useState(false);

    // Draft article state
    const [nom, setNom] = useState('');
    const [quantite, setQuantite] = useState(1);
    const [presentation, setPresentation] = useState('');

    useEffect(() => {
        fetchPersonnel();
    }, []);

    const fetchPersonnel = async () => {
        try {
            const { data, error } = await supabase
                .from('personnel')
                .select('id, Nom, Prenom')
                .order('Nom', { ascending: true });
            if (error) throw error;
            setPersonnelList(data || []);
        } catch (error) {
            console.error('Error fetching personnel:', error);
        } finally {
            setFetchingPersonnel(false);
        }
    };

    const handleAddArticle = () => {
        if (!nom.trim()) return;
        setArticles([...articles, { nom: nom.trim(), quantite: parseInt(quantite) || 1, presentation: presentation.trim() }]);
        setNom('');
        setQuantite(1);
        setPresentation('');
    };

    const handleRemoveArticle = (index) => {
        setArticles(articles.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!personnelId || articles.length === 0) {
            alert("Veuillez sélectionner un personnel et ajouter au moins un article.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.from('requisition').insert([{
                personnel: personnelId,
                article: JSON.stringify(articles),
                etat: 'En Attente'
            }]);

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                onBack(); // Return to previous view after success
            }, 1500);

        } catch (error) {
            alert('Erreur lors de la soumission: ' + error.message);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="submit-req-success">
                <div className="success-icon-container">
                    <Check size={48} className="success-icon" />
                </div>
                <h2>Réquisition Soumise!</h2>
                <p>Votre réquisition a été envoyée avec succès et est en attente d'approbation.</p>
            </div>
        );
    }

    return (
        <div className="submit-req-container">
            {/* Standard Header */}
            <div className="submit-req-header">
                <button className="btn-icon back-btn" onClick={onBack}>
                    <ArrowLeft size={20} />
                </button>
                <div className="header-title">Nouvelle Réquisition</div>
                <div style={{ width: 36 }}></div> {/* Spacer for centering */}
            </div>

            <div className="submit-req-body">
                {/* Personnel Section */}
                <div className="form-section">
                    <label className="section-label">Personnel Émetteur</label>
                    <div className="input-group">
                        <User size={18} className="input-icon" />
                        <select
                            value={personnelId}
                            onChange={(e) => setPersonnelId(e.target.value)}
                            className="modern-input"
                            style={{ appearance: 'none', paddingRight: '40px' }}
                            disabled={fetchingPersonnel}
                        >
                            <option value="" disabled>{fetchingPersonnel ? 'Chargement...' : 'Sélectionner le personnel...'}</option>
                            {personnelList.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.Nom} {p.Prenom}
                                </option>
                            ))}
                        </select>
                        <div style={{ position: 'absolute', right: '14px', pointerEvents: 'none', color: 'var(--text-muted)' }}>
                            <Plus size={16} style={{ transform: 'rotate(45deg)' }} />
                        </div>
                    </div>
                </div>

                {/* Articles List Section */}
                <div className="form-section">
                    <label className="section-label">
                        <span>Articles Ajoutés</span>
                        <span className="badge">{articles.length}</span>
                    </label>

                    {articles.length === 0 ? (
                        <div className="empty-state">
                            <Package size={32} />
                            <p>Aucun article ajouté pour le moment</p>
                        </div>
                    ) : (
                        <div className="articles-list">
                            {articles.map((art, index) => (
                                <div key={index} className="article-card">
                                    <div className="article-info">
                                        <div className="article-name">{art.nom}</div>
                                        {art.presentation && <div className="article-pres">{art.presentation}</div>}
                                    </div>
                                    <div className="article-actions">
                                        <div className="article-qty">×{art.quantite}</div>
                                        <button className="btn-icon delete-btn" onClick={() => handleRemoveArticle(index)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Add New Article Form */}
                <div className="add-article-panel">
                    <div className="panel-title">Ajouter un article</div>

                    <div className="input-group">
                        <Package size={18} className="input-icon" />
                        <input
                            type="text"
                            placeholder="Nom de l'article..."
                            value={nom}
                            onChange={(e) => setNom(e.target.value)}
                            className="modern-input"
                        />
                    </div>

                    <div className="form-row">
                        <div className="input-group flex-1">
                            <FileText size={18} className="input-icon" />
                            <input
                                type="text"
                                placeholder="Présentation (ex: Boite)..."
                                value={presentation}
                                onChange={(e) => setPresentation(e.target.value)}
                                className="modern-input"
                            />
                        </div>
                        <div className="input-group w-32">
                            <input
                                type="number"
                                min="1"
                                value={quantite}
                                onChange={(e) => setQuantite(e.target.value)}
                                className="modern-input text-center"
                            />
                        </div>
                    </div>

                    <button
                        className="btn-secondary full-width"
                        onClick={handleAddArticle}
                        disabled={!nom.trim()}
                    >
                        <Plus size={18} />
                        Ajouter cet article
                    </button>
                </div>

                {/* Bottom Spacer for Sticky Button */}
                <div style={{ height: '90px' }}></div>
            </div>

            {/* Bottom Sticky Submit Button */}
            <div className="submit-sticky-bar">
                <button
                    className="btn-submit-primary"
                    onClick={handleSubmit}
                    disabled={loading || articles.length === 0 || !personnelId}
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                    <span>Soumettre la réquisition</span>
                </button>
            </div>
        </div>
    );
};

export default SubmitRequisition;
