import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { animateStaggerIn } from '../utils/animations';

export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [grantForm, setGrantForm] = useState({ userId: '', resource: 'gold', amount: 100 });
    const [msg, setMsg] = useState('');

    const load = async () => {
        try {
            const [u, s] = await Promise.all([api.getUsers(), api.getStats()]);
            setUsers(u.users); setStats(s.stats);
        } catch (e) { setMsg(e.message); }
    };

    useEffect(() => { load(); }, []);

    const handleBan = async (id) => {
        try { await api.banUser(id); load(); } catch (e) { setMsg(e.message); }
    };
    const handleDelete = async (id) => {
        if (!confirm('确定要删除该用户吗？')) return;
        try { await api.deleteUser(id); load(); } catch (e) { setMsg(e.message); }
    };
    const handleReset = async (id) => {
        if (!confirm('确定要重置该用户数据吗？')) return;
        try { await api.resetUser(id); load(); setMsg('数据已重置'); } catch (e) { setMsg(e.message); }
    };
    const handleGrant = async () => {
        try {
            await api.grantResource(grantForm.userId, grantForm.resource, grantForm.amount);
            setMsg('赠送成功'); load();
        } catch (e) { setMsg(e.message); }
    };

    return (
        <div>
            <div className="game-section">
                <h2>⚙️ 管理员面板</h2>
                {msg && <div style={{ padding: '10px', background: 'rgba(74,222,128,0.1)', border: '1px solid var(--green)', borderRadius: 'var(--radius-xs)', marginBottom: '12px', color: 'var(--green)', fontSize: '14px' }}>{msg}</div>}

                {/* Stats */}
                {stats && (
                    <div className="row g-3 mb-4">
                        {[
                            { label: '总用户数', value: stats.totalUsers, icon: '👥' },
                            { label: '在线用户', value: stats.onlineUsers, icon: '🟢' },
                            { label: '平均等级', value: stats.avgLevel, icon: '⭐' },
                            { label: '全服金币', value: stats.totalGold, icon: '💰' },
                        ].map(s => (
                            <div key={s.label} className="col-6 col-md-3">
                                <div className="stat-card">
                                    <div style={{ fontSize: '24px' }}>{s.icon}</div>
                                    <div className="stat-value">{s.value}</div>
                                    <div className="stat-label">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Grant Resources */}
                <div className="game-card mb-4">
                    <h3>🎁 赠送资源</h3>
                    <div className="d-flex gap-2 flex-wrap align-items-end">
                        <div>
                            <label className="form-label">用户</label>
                            <select className="form-select" value={grantForm.userId} onChange={e => setGrantForm(f => ({ ...f, userId: e.target.value }))}>
                                <option value="">选择用户</option>
                                {users.filter(u => u.role !== 'admin').map(u => <option key={u._id} value={u._id}>{u.username}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">资源</label>
                            <select className="form-select" value={grantForm.resource} onChange={e => setGrantForm(f => ({ ...f, resource: e.target.value }))}>
                                {['gold', 'energy', 'diamond', 'wheat', 'corn', 'carrot', 'potato', 'strawberry', 'watermelon', 'egg', 'milk', 'meat', 'wool'].map(r => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="form-label">数量</label>
                            <input type="number" className="form-control" value={grantForm.amount}
                                onChange={e => setGrantForm(f => ({ ...f, amount: parseInt(e.target.value) || 0 }))} style={{ width: '100px' }} />
                        </div>
                        <button className="btn-gold" onClick={handleGrant} disabled={!grantForm.userId}>赠送</button>
                    </div>
                </div>

                {/* User Table */}
                <div className="game-card" style={{ overflowX: 'auto' }}>
                    <h3>👥 用户管理</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>用户名</th><th>角色</th><th>等级</th><th>金币</th><th>状态</th><th>注册时间</th><th>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id}>
                                    <td style={{ fontWeight: 600 }}>{u.username}</td>
                                    <td>{u.role === 'admin' ? <span className="badge-custom badge-admin">管理员</span> : '玩家'}</td>
                                    <td>{u.gameData?.level || '-'}</td>
                                    <td style={{ color: 'var(--gold)' }}>{u.gameData?.gold || 0}</td>
                                    <td>
                                        {u.isBanned ? <span className="badge-custom badge-banned">已封禁</span> :
                                            u.isOnline ? <span className="badge-custom badge-online">在线</span> : '离线'}
                                    </td>
                                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        {u.role !== 'admin' && (
                                            <div className="d-flex gap-1">
                                                <button className="btn-farm-outline" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => handleBan(u._id)}>
                                                    {u.isBanned ? '解封' : '封禁'}
                                                </button>
                                                <button className="btn-farm-outline" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => handleReset(u._id)}>重置</button>
                                                <button className="btn-danger-custom" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => handleDelete(u._id)}>删除</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
