import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { animateBounceIn, animateShake } from '../utils/animations';

export default function LoginPage({ onSwitch }) {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const cardRef = useRef(null);
    const formRef = useRef(null);

    useEffect(() => { animateBounceIn(cardRef.current); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(''); setLoading(true);
        try { await login(username, password); }
        catch (err) { setError(err.message); animateShake(formRef.current); }
        finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" ref={cardRef}>
                <span className="farm-emoji">🌾</span>
                <h2>欢迎回到农场</h2>
                <p className="subtitle">登录你的账号，继续经营农场</p>
                <form onSubmit={handleSubmit} ref={formRef}>
                    {error && <div className="alert alert-danger py-2" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)', borderRadius: 'var(--radius-xs)' }}>{error}</div>}
                    <div className="mb-3">
                        <label className="form-label">用户名</label>
                        <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} placeholder="请输入用户名" required />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">密码</label>
                        <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="请输入密码" required />
                    </div>
                    <button type="submit" className="btn btn-farm w-100 mb-3" disabled={loading}>{loading ? '登录中...' : '🚜 登录'}</button>
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        还没有账号？<a href="#" onClick={e => { e.preventDefault(); onSwitch() }} style={{ color: 'var(--green)', cursor: 'pointer' }}>立即注册</a>
                    </p>
                </form>
            </div>
        </div>
    );
}
