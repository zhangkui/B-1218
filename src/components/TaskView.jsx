import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function TaskView({ gameData, setGameData, onMessage }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(null);

    const loadTasks = async () => {
        try {
            const data = await api.getTasks();
            setTasks(data.tasks || []);
        } catch (e) {
            console.error('加载任务失败', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const handleClaim = async (taskType) => {
        setClaiming(taskType);
        try {
            const result = await api.claimTask(taskType);
            if (result.gameData) setGameData(result.gameData);
            onMessage && onMessage(result.message || '领取成功');
            await loadTasks();
        } catch (e) {
            onMessage && onMessage(e.message || '领取失败', true);
        } finally {
            setClaiming(null);
        }
    };

    const getTaskStatus = (t) => {
        if (t.claimed) return { label: '已领取', cls: 'badge-custom badge-muted', btn: null };
        if (t.completed) return { label: '可领取', cls: 'badge-custom badge-success', btn: 'claim' };
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

    return (
        <div className="game-section">
            <h2 style={{ marginBottom: '16px' }}>📋 每日任务</h2>
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>加载中...</div>
            ) : tasks.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>暂无任务</div>
            ) : (
                <div className="row g-3">
                    {tasks.map(t => {
                        const status = getTaskStatus(t);
                        const pct = Math.min(100, (t.progress / t.targetCount) * 100);
                        return (
                            <div key={t.taskType} className="col-12 col-lg-6">
                                <div className="game-card" style={{ padding: '16px' }}>
                                    <div className="d-flex justify-content-between align-items-start" style={{ marginBottom: '10px' }}>
                                        <div className="d-flex align-items-center gap-2">
                                            <span style={{ fontSize: '28px' }}>{t.icon}</span>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: '15px' }}>{t.name}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.description}</div>
                                            </div>
                                        </div>
                                        <span className={status.cls}>{status.label}</span>
                                    </div>

                                    <div style={{ marginBottom: '10px' }}>
                                        <div className="d-flex justify-content-between" style={{ fontSize: '12px', marginBottom: '4px', color: 'var(--text-muted)' }}>
                                            <span>进度</span>
                                            <span style={{ fontWeight: 600 }}>{t.progress} / {t.targetCount}</span>
                                        </div>
                                        <div className="progress-bar-custom">
                                        <div
                                            className="progress-bar-fill"
                                            style={{
                                                width: `${pct}%`,
                                                background: t.claimed
                                                    ? 'linear-gradient(90deg, #6b7280, #9ca3af)'
                                                    : t.completed
                                                        ? 'linear-gradient(90deg, var(--green), #86efac)'
                                                        : 'linear-gradient(90deg, var(--gold), #fde047)'
                                            }}
                                        />
                                    </div>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center">
                                        <div style={{ fontSize: '13px' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>奖励：</span>
                                            <span style={{ fontWeight: 600, color: 'var(--gold)' }}>{formatRewards(t.rewards)}</span>
                                        </div>
                                        {status.btn === 'claim' && (
                                            <button
                                                className="btn-gold"
                                                style={{ fontSize: '12px', padding: '6px 14px' }}
                                                onClick={() => handleClaim(t.taskType)}
                                                disabled={claiming === t.taskType}
                                            >
                                                {claiming === t.taskType ? '领取中...' : '领取奖励'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
