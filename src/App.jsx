import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GameProvider } from './context/GameContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GamePage from './pages/GamePage';

function AppContent() {
    const { user, loading } = useAuth();
    const [page, setPage] = useState('login');

    if (loading) return (
        <div className="loading-screen">
            <div className="spinner" />
            <div style={{ color: 'var(--text-secondary)', marginTop: '12px' }}>🌾 加载中...</div>
        </div>
    );

    if (!user) {
        return page === 'login'
            ? <LoginPage onSwitch={() => setPage('register')} />
            : <RegisterPage onSwitch={() => setPage('login')} />;
    }

    return (
        <GameProvider>
            <GamePage />
        </GameProvider>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
