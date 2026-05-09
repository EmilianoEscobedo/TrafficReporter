import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import './LoginScreen.css';

export default function LoginScreen() {
    const { signInWithGoogle, isLoading, unauthorizedEmail } = useAuth();
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (unauthorizedEmail) {
            setError('No tienes permiso para acceder. Si crees que se trata de un error, ponte en contacto con La Trocha Digital.');
        }
    }, [unauthorizedEmail]);

    const handleSignIn = async () => {
        setError('');
        try {
            await signInWithGoogle();
        } catch (err: any) {
            if (err.code === 'auth/popup-closed-by-user') {
                setError('Inicio de sesión cancelado.');
            } else {
                setError(`Error de autenticación: ${err.message}`);
            }
        }
    };

    return (
        <div className="login-screen">
            <div className="login-screen__container">
                <div className="login-screen__header">
                    <img src="/logo.png" alt="Logo" className="login-screen__logo" />
                    <h2 className="login-screen__title">
                        Monitor de Siniestros Viales
                    </h2>
                </div>
                <div className="login-screen__content">
                    {error && (
                        <div className="login-screen__error">
                            {error}
                        </div>
                    )}
                    <button
                        onClick={handleSignIn}
                        disabled={isLoading}
                        className={`login-screen__button ${isLoading ? 'login-screen__button--loading' : ''}`}
                    >
                        <span className="login-screen__button-text">
                            {isLoading ? 'Conectando...' : 'Iniciar Sesión'}
                        </span>
                        {isLoading && (
                            <div className="login-screen__spinner"></div>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
