import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import './Header.css';

export default function Header() {
    const { currentUser, logout } = useAuth();

    return (
        <header className="header">
            <div className="header__container">
                <div className="header__top">
                    <div className="header__brand">
                        <img src="logo.png" alt="Logo" className="header__logo" />
                        <div className="header__title-wrapper">
                            <h1 className="header__title">Registro de Siniestros Viales</h1>
                            <div className="header__subtitle">
                                <p className="header__subtitle-text">
                                    Herramienta de recolección y análisis para periodismo de impacto | DOE Prensa ®
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="header__actions">
                        <div className="header__user">
                            <p className="header__user-label">Conectado como:</p>
                            <p className="header__user-email">{currentUser?.email || 'Cargando...'}</p>
                        </div>
                        <button onClick={logout} className="header__logout-btn" title="Cerrar sesión">
                            <svg className="header__logout-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="header__user-mobile">
                    <p className="header__user-email-mobile">{currentUser?.email || 'Cargando...'}</p>
                </div>
            </div>
        </header>
    );
};
