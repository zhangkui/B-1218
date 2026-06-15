import React from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();
    return (
        <nav className="farm-navbar">
            <div className="container d-flex align-items-center justify-content-between">
                <div className="brand">🌾 <span>你的农场</span></div>
                <div className="d-flex align-items-center gap-3">
                    <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                        👤 {user?.username}
                        {user?.role === 'admin' && <span className="badge-custom badge-admin ms-2">管理员</span>}
                    </span>
                    <button className="btn-farm-outline" onClick={logout} style={{ fontSize: '13px', padding: '6px 14px' }}>退出</button>
                </div>
            </div>
        </nav>
    );
}
