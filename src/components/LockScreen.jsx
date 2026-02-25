import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, ArrowRight, AlertCircle, Activity } from 'lucide-react';

const LockScreen = ({ user, onUnlock }) => {
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleUnlock = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: dbError } = await supabase
                .from('personnel')
                .select('*')
                .eq('id', user.id)
                .eq('pin_code', pin)
                .single();

            if (dbError || !data) {
                throw new Error('Code PIN incorrect.');
            }

            onUnlock();
        } catch (err) {
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-background">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>

            <div className="login-card">
                <div className="login-header">
                    <div className="logo-container">
                        <Lock size={32} className="logo-icon" />
                    </div>
                    <h1>Session Verrouillée</h1>
                    <p>Bonjour {user.Prenom || ''} {user.Nom || ''}, veuillez entrer votre PIN.</p>
                </div>

                {error && (
                    <div className="error-message">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleUnlock} className="login-form">
                    <div className="input-group">
                        <label>Code PIN</label>
                        <div className="input-with-icon">
                            <Lock size={18} className="input-icon" />
                            <input
                                type="password"
                                required
                                placeholder="••••"
                                maxLength={8}
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                className="modern-input"
                                autoFocus
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn-primary login-btn"
                        disabled={loading || !pin}
                    >
                        {loading ? (
                            <span className="spinner"></span>
                        ) : (
                            <>
                                Déverrouiller
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: var(--background);
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .login-background {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          opacity: 0.6;
        }

        .blob {
          position: absolute;
          filter: blur(80px);
          border-radius: 50%;
          z-index: 0;
          animation: float 10s ease-in-out infinite;
        }

        .blob-1 {
          top: -10%;
          left: -10%;
          width: 50vw;
          height: 50vw;
          background: rgba(35, 131, 226, 0.15);
          animation-delay: 0s;
        }

        .blob-2 {
          bottom: -10%;
          right: -10%;
          width: 40vw;
          height: 40vw;
          background: rgba(16, 185, 129, 0.15);
          animation-delay: -5s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(5%, 5%) scale(1.05); }
        }

        .login-card {
          position: relative;
          z-index: 1;
          background: var(--surface);
          border: 1px solid var(--border);
          padding: 48px;
          border-radius: 24px;
          width: 100%;
          max-width: 440px;
          animation: slideUp 0.5s ease-out;
        }

        [data-theme='dark'] .login-card {
          background: rgba(32, 32, 32, 0.8);
          backdrop-filter: blur(20px);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo-container {
          width: 64px;
          height: 64px;
          background: var(--primary);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: white;
        }

        .login-header h1 {
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }

        .login-header p {
          color: var(--text-muted);
          font-size: 15px;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(235, 87, 87, 0.1);
          color: #eb5757;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 24px;
          animation: shake 0.4s ease-in-out;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 8px;
          display: block;
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
          transition: color 0.2s ease;
        }

        .input-with-icon .modern-input {
          padding: 14px 14px 14px 44px;
          background: var(--sidebar-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          font-size: 15px;
          width: 100%;
          color: var(--text);
          transition: all 0.2s ease;
        }

        .input-with-icon .modern-input:focus {
          background: var(--background);
          border-color: var(--primary);
        }

        .input-with-icon .modern-input:focus + .input-icon {
          color: var(--primary);
        }

        .login-btn {
          margin-top: 8px;
          padding: 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .login-btn:not(:disabled):hover {
          filter: brightness(1.1);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .login-card {
            margin: 16px;
            padding: 32px 24px;
          }
        }
      `}} />
        </div>
    );
};

export default LockScreen;
