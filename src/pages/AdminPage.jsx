import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { animateStaggerIn } from '../utils/animations';

export default function AdminPage() {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [grantForm, setGrantForm] = useState({ userId: '', resource: 'gold', amount: 100 });
    const [taskConfigs, setTaskConfigs] = useState([]);
    const [achievementConfigs, setAchievementConfigs] = useState([]);
    const [showNewAchievement, setShowNewAchievement] = useState(false);
    const [newAchievement, setNewAchievement] = useState({
        achievementType: 'plant',
        name: '',
        description: '',
        icon: '🏆',
        targetCount: 10,
        rewards: { gold: 0, diamond: 0, exp: 0, energy: 0 },
        enabled: true,
        sortOrder: 0
    });
    const [msg, setMsg] = useState('');
    const [msgType, setMsgType] = useState('success');

    const showMessage = (text, type = 'success') => {
        setMsg(text);
        setMsgType(type);
    };

    const load = async () => {
        try {
            const [u, s, tc, ac] = await Promise.all([
                api.getUsers(), api.getStats(), api.getTaskConfigs(), api.getAchievementConfigs()
            ]);
            setUsers(u.users); setStats(s.stats); setTaskConfigs(tc.configs || []);
            setAchievementConfigs(ac.configs || []);
        } catch (e) { showMessage(e.message, 'error'); }
    };

    useEffect(() => { load(); }, []);

    const handleBan = async (id) => {
        try { await api.banUser(id); load(); } catch (e) { showMessage(e.message, 'error'); }
    };
    const handleDelete = async (id) => {
        if (!confirm('确定要删除该用户吗？')) return;
        try { await api.deleteUser(id); load(); } catch (e) { showMessage(e.message, 'error'); }
    };
    const handleReset = async (id) => {
        if (!confirm('确定要重置该用户数据吗？')) return;
        try { await api.resetUser(id); load(); showMessage('数据已重置'); } catch (e) { showMessage(e.message, 'error'); }
    };
    const handleGrant = async () => {
        try {
            await api.grantResource(grantForm.userId, grantForm.resource, grantForm.amount);
            showMessage('赠送成功'); load();
        } catch (e) { showMessage(e.message, 'error'); }
    };

    const updateConfigField = (taskType, field, value) => {
        setTaskConfigs(prev => prev.map(c => {
            if (c.taskType !== taskType) return c;
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                return { ...c, [parent]: { ...c[parent], [child]: value } };
            }
            return { ...c, [field]: value };
        }));
    };

    const handleSaveConfig = async (taskType) => {
        const config = taskConfigs.find(c => c.taskType === taskType);
        if (!config) return;
        try {
            const data = {
                name: config.name,
                description: config.description,
                icon: config.icon,
                targetCount: Number(config.targetCount),
                rewards: {
                    gold: Number(config.rewards.gold) || 0,
                    diamond: Number(config.rewards.diamond) || 0,
                    exp: Number(config.rewards.exp) || 0,
                    energy: Number(config.rewards.energy) || 0,
                },
                enabled: config.enabled,
                sortOrder: Number(config.sortOrder) || 0
            };
            await api.updateTaskConfig(taskType, data);
            showMessage(`任务「${config.name}」配置已保存`);
            load();
        } catch (e) { showMessage(e.message, 'error'); }
    };

    const toggleEnabled = async (taskType) => {
        const config = taskConfigs.find(c => c.taskType === taskType);
        if (!config) return;
        try {
            await api.updateTaskConfig(taskType, { enabled: !config.enabled });
            showMessage(`任务「${config.name}」已${!config.enabled ? '启用' : '禁用'}`);
            load();
        } catch (e) { showMessage(e.message, 'error'); }
    };

    const taskTypeLabels = {
        login: '登录任务',
        plant: '种植任务',
        harvest: '收获任务',
        feed_collect: '养殖收取任务'
    };

    const achievementTypeLabels = {
        plant: '种植成就',
        harvest: '收获成就',
        feed_collect: '养殖成就'
    };

    const updateAchievementField = (id, field, value) => {
        setAchievementConfigs(prev => prev.map(c => {
            if (c._id !== id) return c;
            if (field.includes('.')) {
                const [parent, child] = field.split('.');
                return { ...c, [parent]: { ...c[parent], [child]: value } };
            }
            return { ...c, [field]: value };
        }));
    };

    const handleSaveAchievement = async (id) => {
        const config = achievementConfigs.find(c => c._id === id);
        if (!config) return;
        try {
            const data = {
                achievementType: config.achievementType,
                name: config.name,
                description: config.description,
                icon: config.icon,
                targetCount: Number(config.targetCount),
                rewards: {
                    gold: Number(config.rewards.gold) || 0,
                    diamond: Number(config.rewards.diamond) || 0,
                    exp: Number(config.rewards.exp) || 0,
                    energy: Number(config.rewards.energy) || 0,
                },
                enabled: config.enabled,
                sortOrder: Number(config.sortOrder) || 0
            };
            await api.updateAchievementConfig(id, data);
            showMessage(`成就「${config.name}」配置已保存`);
            load();
        } catch (e) { showMessage(e.message, 'error'); }
    };

    const toggleAchievementEnabled = async (id) => {
        const config = achievementConfigs.find(c => c._id === id);
        if (!config) return;
        try {
            await api.updateAchievementConfig(id, { enabled: !config.enabled });
            showMessage(`成就「${config.name}」已${!config.enabled ? '启用' : '禁用'}`);
            load();
        } catch (e) { showMessage(e.message, 'error'); }
    };

    const handleDeleteAchievement = async (id) => {
        if (!confirm('确定要删除该成就吗？')) return;
        try {
            const config = achievementConfigs.find(c => c._id === id);
            await api.deleteAchievementConfig(id);
            showMessage(`成就「${config?.name || ''}」已删除`);
            load();
        } catch (e) { showMessage(e.message, 'error'); }
    };

    const handleCreateAchievement = async () => {
        if (!newAchievement.name || !newAchievement.description) {
            showMessage('名称和描述不能为空', 'error');
            return;
        }
        try {
            await api.createAchievementConfig(newAchievement);
            showMessage('成就创建成功');
            setShowNewAchievement(false);
            setNewAchievement({
                achievementType: 'plant',
                name: '',
                description: '',
                icon: '🏆',
                targetCount: 10,
                rewards: { gold: 0, diamond: 0, exp: 0, energy: 0 },
                enabled: true,
                sortOrder: 0
            });
            load();
        } catch (e) { showMessage(e.message, 'error'); }
    };

    return (
        <div>
            <div className="game-section">
                <h2>⚙️ 管理员面板</h2>
                {msg && <div style={{
                    padding: '10px',
                    background: msgType === 'error' ? 'rgba(248,113,113,0.1)' : 'rgba(74,222,128,0.1)',
                    border: `1px solid ${msgType === 'error' ? 'var(--red)' : 'var(--green)'}`,
                    borderRadius: 'var(--radius-xs)',
                    marginBottom: '12px',
                    color: msgType === 'error' ? 'var(--red)' : 'var(--green)',
                    fontSize: '14px'
                }}>{msg}</div>}

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

                {/* Task Configs */}
                <div className="game-card mb-4">
                    <h3 style={{ marginBottom: '16px' }}>📋 日常任务配置</h3>
                    <div className="row g-3">
                        {taskConfigs.map(cfg => (
                            <div key={cfg.taskType} className="col-12 col-lg-6">
                                <div style={{
                                    padding: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(255,255,255,0.03)'
                                }}>
                                    <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '12px' }}>
                                        <div style={{ fontWeight: 700 }}>
                                            <span style={{ fontSize: '20px', marginRight: '8px' }}>{cfg.icon}</span>
                                            {taskTypeLabels[cfg.taskType]} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>({cfg.taskType})</span>
                                        </div>
                                        <label className="form-check form-switch" style={{ marginBottom: 0 }}>
                                            <input className="form-check-input" type="checkbox"
                                                checked={cfg.enabled} onChange={() => toggleEnabled(cfg.taskType)} />
                                            <span className="form-check-label" style={{ fontSize: '12px' }}>
                                                {cfg.enabled ? '启用' : '禁用'}
                                            </span>
                                        </label>
                                    </div>

                                    <div className="row g-2 mb-2">
                                        <div className="col-6">
                                            <label className="form-label" style={{ fontSize: '12px' }}>任务名称</label>
                                            <input type="text" className="form-control form-control-sm"
                                                value={cfg.name} onChange={e => updateConfigField(cfg.taskType, 'name', e.target.value)} />
                                        </div>
                                        <div className="col-3">
                                            <label className="form-label" style={{ fontSize: '12px' }}>图标</label>
                                            <input type="text" className="form-control form-control-sm"
                                                value={cfg.icon} onChange={e => updateConfigField(cfg.taskType, 'icon', e.target.value)} />
                                        </div>
                                        <div className="col-3">
                                            <label className="form-label" style={{ fontSize: '12px' }}>排序</label>
                                            <input type="number" className="form-control form-control-sm"
                                                value={cfg.sortOrder} onChange={e => updateConfigField(cfg.taskType, 'sortOrder', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label" style={{ fontSize: '12px' }}>任务描述</label>
                                        <input type="text" className="form-control form-control-sm"
                                            value={cfg.description} onChange={e => updateConfigField(cfg.taskType, 'description', e.target.value)} />
                                    </div>

                                    <div className="row g-2 mb-2">
                                        <div className="col-6">
                                            <label className="form-label" style={{ fontSize: '12px' }}>目标次数</label>
                                            <input type="number" min="1" className="form-control form-control-sm"
                                                value={cfg.targetCount} onChange={e => updateConfigField(cfg.taskType, 'targetCount', e.target.value)} />
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--gold)' }}>奖励配置</div>
                                    <div className="row g-2 mb-3">
                                        <div className="col-3">
                                            <label className="form-label" style={{ fontSize: '11px' }}>💰 金币</label>
                                            <input type="number" min="0" className="form-control form-control-sm"
                                                value={cfg.rewards.gold} onChange={e => updateConfigField(cfg.taskType, 'rewards.gold', e.target.value)} />
                                        </div>
                                        <div className="col-3">
                                            <label className="form-label" style={{ fontSize: '11px' }}>💎 钻石</label>
                                            <input type="number" min="0" className="form-control form-control-sm"
                                                value={cfg.rewards.diamond} onChange={e => updateConfigField(cfg.taskType, 'rewards.diamond', e.target.value)} />
                                        </div>
                                        <div className="col-3">
                                            <label className="form-label" style={{ fontSize: '11px' }}>⭐ 经验</label>
                                            <input type="number" min="0" className="form-control form-control-sm"
                                                value={cfg.rewards.exp} onChange={e => updateConfigField(cfg.taskType, 'rewards.exp', e.target.value)} />
                                        </div>
                                        <div className="col-3">
                                            <label className="form-label" style={{ fontSize: '11px' }}>⚡ 体力</label>
                                            <input type="number" min="0" className="form-control form-control-sm"
                                                value={cfg.rewards.energy} onChange={e => updateConfigField(cfg.taskType, 'rewards.energy', e.target.value)} />
                                        </div>
                                    </div>

                                    <button className="btn-farm w-100" onClick={() => handleSaveConfig(cfg.taskType)}>保存配置</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Achievement Configs */}
                <div className="game-card mb-4">
                    <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '16px' }}>
                        <h3 style={{ margin: 0 }}>🏆 成就配置</h3>
                        <button className="btn-gold" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={() => setShowNewAchievement(!showNewAchievement)}>
                            {showNewAchievement ? '取消' : '+ 新增成就'}
                        </button>
                    </div>

                    {showNewAchievement && (
                        <div style={{
                            padding: '16px',
                            marginBottom: '16px',
                            border: '2px dashed var(--gold)',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(245,158,11,0.05)'
                        }}>
                            <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--gold)' }}>✨ 新建成就</h4>
                            <div className="row g-2 mb-2">
                                <div className="col-4">
                                    <label className="form-label" style={{ fontSize: '12px' }}>成就类型</label>
                                    <select className="form-select form-select-sm"
                                        value={newAchievement.achievementType}
                                        onChange={e => setNewAchievement({ ...newAchievement, achievementType: e.target.value })}>
                                        <option value="plant">种植成就</option>
                                        <option value="harvest">收获成就</option>
                                        <option value="feed_collect">养殖成就</option>
                                    </select>
                                </div>
                                <div className="col-5">
                                    <label className="form-label" style={{ fontSize: '12px' }}>成就名称</label>
                                    <input type="text" className="form-control form-control-sm"
                                        value={newAchievement.name}
                                        onChange={e => setNewAchievement({ ...newAchievement, name: e.target.value })} />
                                </div>
                                <div className="col-1">
                                    <label className="form-label" style={{ fontSize: '12px' }}>图标</label>
                                    <input type="text" className="form-control form-control-sm"
                                        value={newAchievement.icon}
                                        onChange={e => setNewAchievement({ ...newAchievement, icon: e.target.value })} />
                                </div>
                                <div className="col-2">
                                    <label className="form-label" style={{ fontSize: '12px' }}>排序</label>
                                    <input type="number" className="form-control form-control-sm"
                                        value={newAchievement.sortOrder}
                                        onChange={e => setNewAchievement({ ...newAchievement, sortOrder: e.target.value })} />
                                </div>
                            </div>
                            <div className="mb-2">
                                <label className="form-label" style={{ fontSize: '12px' }}>成就描述</label>
                                <input type="text" className="form-control form-control-sm"
                                    value={newAchievement.description}
                                    onChange={e => setNewAchievement({ ...newAchievement, description: e.target.value })} />
                            </div>
                            <div className="row g-2 mb-3">
                                <div className="col-4">
                                    <label className="form-label" style={{ fontSize: '12px' }}>目标次数</label>
                                    <input type="number" min="1" className="form-control form-control-sm"
                                        value={newAchievement.targetCount}
                                        onChange={e => setNewAchievement({ ...newAchievement, targetCount: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--gold)' }}>奖励配置</div>
                            <div className="row g-2 mb-3">
                                {['gold', 'diamond', 'exp', 'energy'].map(r => (
                                    <div key={r} className="col-3">
                                        <label className="form-label" style={{ fontSize: '11px' }}>
                                            {r === 'gold' ? '💰 金币' : r === 'diamond' ? '💎 钻石' : r === 'exp' ? '⭐ 经验' : '⚡ 体力'}
                                        </label>
                                        <input type="number" min="0" className="form-control form-control-sm"
                                            value={newAchievement.rewards[r]}
                                            onChange={e => setNewAchievement({
                                                ...newAchievement,
                                                rewards: { ...newAchievement.rewards, [r]: e.target.value }
                                            })} />
                                    </div>
                                ))}
                            </div>
                            <div className="d-flex gap-2">
                                <button className="btn-farm" onClick={handleCreateAchievement}>创建成就</button>
                                <button className="btn-farm-outline" onClick={() => setShowNewAchievement(false)}>取消</button>
                            </div>
                        </div>
                    )}

                    <div className="row g-3">
                        {achievementConfigs.map(cfg => (
                            <div key={cfg._id} className="col-12 col-lg-6">
                                <div style={{
                                    padding: '16px',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(255,255,255,0.03)'
                                }}>
                                    <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: '12px' }}>
                                        <div style={{ fontWeight: 700 }}>
                                            <span style={{ fontSize: '20px', marginRight: '8px' }}>{cfg.icon}</span>
                                            {achievementTypeLabels[cfg.achievementType]} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 400 }}>({cfg.achievementType})</span>
                                        </div>
                                        <div className="d-flex align-items-center gap-2">
                                            <label className="form-check form-switch" style={{ marginBottom: 0 }}>
                                                <input className="form-check-input" type="checkbox"
                                                    checked={cfg.enabled} onChange={() => toggleAchievementEnabled(cfg._id)} />
                                                <span className="form-check-label" style={{ fontSize: '12px' }}>
                                                    {cfg.enabled ? '启用' : '禁用'}
                                                </span>
                                            </label>
                                            <button className="btn-danger-custom" style={{ fontSize: '11px', padding: '4px 8px' }} onClick={() => handleDeleteAchievement(cfg._id)}>删除</button>
                                        </div>
                                    </div>

                                    <div className="row g-2 mb-2">
                                        <div className="col-6">
                                            <label className="form-label" style={{ fontSize: '12px' }}>成就名称</label>
                                            <input type="text" className="form-control form-control-sm"
                                                value={cfg.name} onChange={e => updateAchievementField(cfg._id, 'name', e.target.value)} />
                                        </div>
                                        <div className="col-3">
                                            <label className="form-label" style={{ fontSize: '12px' }}>图标</label>
                                            <input type="text" className="form-control form-control-sm"
                                                value={cfg.icon} onChange={e => updateAchievementField(cfg._id, 'icon', e.target.value)} />
                                        </div>
                                        <div className="col-3">
                                            <label className="form-label" style={{ fontSize: '12px' }}>排序</label>
                                            <input type="number" className="form-control form-control-sm"
                                                value={cfg.sortOrder} onChange={e => updateAchievementField(cfg._id, 'sortOrder', e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label" style={{ fontSize: '12px' }}>成就描述</label>
                                        <input type="text" className="form-control form-control-sm"
                                            value={cfg.description} onChange={e => updateAchievementField(cfg._id, 'description', e.target.value)} />
                                    </div>

                                    <div className="row g-2 mb-2">
                                        <div className="col-6">
                                            <label className="form-label" style={{ fontSize: '12px' }}>目标次数</label>
                                            <input type="number" min="1" className="form-control form-control-sm"
                                                value={cfg.targetCount} onChange={e => updateAchievementField(cfg._id, 'targetCount', e.target.value)} />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label" style={{ fontSize: '12px' }}>成就类型</label>
                                            <select className="form-select form-select-sm"
                                                value={cfg.achievementType} onChange={e => updateAchievementField(cfg._id, 'achievementType', e.target.value)}>
                                                <option value="plant">种植成就</option>
                                                <option value="harvest">收获成就</option>
                                                <option value="feed_collect">养殖成就</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--gold)' }}>奖励配置</div>
                                    <div className="row g-2 mb-3">
                                        <div className="col-3">
                                            <label className="form-label" style={{ fontSize: '11px' }}>💰 金币</label>
                                            <input type="number" min="0" className="form-control form-control-sm"
                                                value={cfg.rewards.gold} onChange={e => updateAchievementField(cfg._id, 'rewards.gold', e.target.value)} />
                                        </div>
                                        <div className="col-3">
                                            <label className="form-label" style={{ fontSize: '11px' }}>💎 钻石</label>
                                            <input type="number" min="0" className="form-control form-control-sm"
                                                value={cfg.rewards.diamond} onChange={e => updateAchievementField(cfg._id, 'rewards.diamond', e.target.value)} />
                                        </div>
                                        <div className="col-3">
                                            <label className="form-label" style={{ fontSize: '11px' }}>⭐ 经验</label>
                                            <input type="number" min="0" className="form-control form-control-sm"
                                                value={cfg.rewards.exp} onChange={e => updateAchievementField(cfg._id, 'rewards.exp', e.target.value)} />
                                        </div>
                                        <div className="col-3">
                                            <label className="form-label" style={{ fontSize: '11px' }}>⚡ 体力</label>
                                            <input type="number" min="0" className="form-control form-control-sm"
                                                value={cfg.rewards.energy} onChange={e => updateAchievementField(cfg._id, 'rewards.energy', e.target.value)} />
                                        </div>
                                    </div>

                                    <button className="btn-farm w-100" onClick={() => handleSaveAchievement(cfg._id)}>保存配置</button>
                                </div>
                            </div>
                        ))}
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

