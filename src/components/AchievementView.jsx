import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function AchievementView({ gameData, setGameData, onMessage }) {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(null);

    const loadAchievements = async () => {
        try {
            const data = await api.getAchievements();
            setAchievements(data.achievements || []);
        } catch (e) {
            console.error('加载成就失败', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAchievements();
    }, []);

    const handleClaim = async (achievementId) => {
        setClaiming(achievementId);
        try {
            const result = await api.claimAchievement(achievementId);
            if (result.gameData) setGameData(result.gameData);
            onMessage && onMessage(result.message || '领取成功');
            await loadAchievements();
        } catch (e) {
            onMessage && onMessage(e.message || '领取失败', true);
        } finally {
            setClaiming(null);
        }
    };

    const getAchievementStatus = (a) => {
        if (a.claimed) return { label: '已领取', cls: 'badge-custom badge-muted', btn: null };
        if (a.completed) return { label: '可领取', cls: 'badge-custom badge-success', btn: 'claim' };
        return { label: '进行中', cls: 'badge-custom badge-info', btn: null };
    };

    const formatRewards = (r) => {
        const parts = [];
        if (r.gold) parts.push(`💰${r.gold}`);
        if (r.diamond) parts.push(`💎${r.diamond}`);
        if (r.exp) parts.push(`⭐${r.exp}`);
        if (r.energy) parts.push(`⚡${r.energy}`);
        return parts.join('  ');
    };

    const typeLabels = {
        plant: '🌱 种植成就',
        harvest: '🌾 收获成就',
        feed_collect: '🐄 养殖成就'
    };

    const grouped = achievements.reduce((acc, a) => {
        if (!acc[a.achievementType]) acc[a.achievementType] = [];
        acc[a.achievementType].push(a);
        return acc;
    }, {});

    return (
        <div className="game-section">
            <h2 style={{ marginBottom: '16px' }}>🏆 成就系统</h2>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>加载中...</div>
            ) : achievements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>暂无成就</div>
            ) : (
                Object.entries(grouped).map(([type, list]) => (
                    <div key={type} style={{ marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            {typeLabels[type] || type}
                        </h3>
                        <div className="row g-3">
                            {list.map(a => {
                                const status = getAchievementStatus(a);
                                const pct = Math.min(100, (a.progress / a.targetCount) * 100);
                                return (
                                    <div key={a._id} className="col-12 col-lg-6">
                                        <div className={`game-card ${a.claimed ? 'achievement-claimed' : a.completed ? 'achievement-completed' : ''}`} style={{ padding: '16px' }}>
                                            <div className="d-flex justify-content-between align-items-start" style={{ marginBottom: '10px' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span style={{ fontSize: '28px' }}>{a.icon}</span>
                                                    <div>
                                                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{a.name}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{a.description}</div>
                                                    </div>
                                                </div>
                                                <span className={status.cls}>{status.label}</span>
                                            </div>

                                            <div style={{ marginBottom: '10px' }}>
                                                <div className="d-flex justify-content-between" style={{ fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>
                                                    <span>进度</span>
                                                    <span style={{ fontWeight: 600 }}>{a.progress} / {a.targetCount}</span>
                                                </div>
                                                <div className="progress-bar-custom">
                                                    <div
                                                        className="progress-bar-fill"
                                                        style={{
                                                            width: `${pct}%`,
                                                            background: a.claimed
                                                                ? 'linear-gradient(90deg, #6b7280, #9ca3af)'
                                                                : a.completed
                                                                    ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                                                    : 'linear-gradient(90deg, var(--blue), #60a5fa)'
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="d-flex justify-content-between align-items-center">
                                                <div style={{ fontSize: '13px' }}>
                                                    <span style={{ color: 'var(--text-muted)' }}>奖励：</span>
                                                    <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{formatRewards(a.rewards)}</span>
                                                </div>
                                                {status.btn === 'claim' && (
                                                    <button
                                                        className="btn-gold"
                                                        style={{ fontSize: '12px', padding: '6px 14px' }}
                                                        onClick={() => handleClaim(a._id)}
                                                        disabled={claiming === a._id}
                                                    >
                                                        {claiming === a._id ? '领取中...' : '领取奖励'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
