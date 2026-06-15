import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { animateBounceIn, animateShake } from '../utils/animations';

export default function RegisterPage({ onSwitch }) {
    const { register } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const cardRef = useRef(null);
    const formRef = useRef(null);

    useEffect(() => { animateBounceIn(cardRef.current); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        if (password !== confirm) { setError('两次密码不一致'); animateShake(formRef.current); return; }
        setLoading(true);
        try { await register(username, password); }
        catch (err) { setError(err.message); animateShake(formRef.current); }
        finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card" ref={cardRef}>
                <span className="farm-emoji">🌱</span>
                <h2>创建新农场</h2>
                <p className="subtitle">注册账号，开始你的农场生活</p>
                <form onSubmit={handleSubmit} ref={formRef}>
                    {error && <div className="alert alert-danger py-2" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--red)', borderRadius: 'var(--radius-xs)' }}>{error}</div>}
                    <div className="mb-3">
                        <label className="form-label">用户名</label>
                        <input type="text" className="form-control" value={username} onChange={e => setUsername(e.target.value)} placeholder="2-20个字符" required minLength={2} maxLength={20} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">密码</label>
                        <input type="password" className="form-control" value={password} onChange={e => setPassword(e.target.value)} placeholder="至少6个字符" required minLength={6} />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">确认密码</label>
                        <input type="password" className="form-control" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="再次输入密码" required />
                    </div>
                    <button type="submit" className="btn btn-farm w-100 mb-3" disabled={loading}>{loading ? '注册中...' : '🌱 注册'}</button>
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>
                        已有账号？<a href="#" onClick={e => { e.preventDefault(); onSwitch() }} style={{ color: 'var(--green)', cursor: 'pointer' }}>立即登录</a>
                    </p>
                </form>
            </div>
        </div>
    );
}
