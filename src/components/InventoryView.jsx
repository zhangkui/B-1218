import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function InventoryView() {
    const { gameData, config, sell } = useGame();
    const [sellAmount, setSellAmount] = useState({});
    if (!gameData || !config) return null;

    const resources = [
        ...Object.entries(config.crops).map(([k, c]) => ({ key: k, name: c.name, icon: c.icon, count: gameData.resources[k], price: c.sellPrice })),
        ...Object.entries(config.animals).map(([, a]) => ({ key: a.product, name: a.productName, icon: a.icon, count: gameData.resources[a.product], price: a.sellPrice }))
    ];

    const handleSell = async (key) => {
        const amt = sellAmount[key] || 1;
        await sell(key, amt);
        setSellAmount(prev => ({ ...prev, [key]: '' }));
    };

    return (
        <div>
            <div className="game-section">
                <h2>📦 仓库</h2>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    仓库容量：{config.buildings.warehouse.baseCapacity + (gameData.buildings.warehouse.level - 1) * config.buildings.warehouse.capacityPerLevel}
                </div>
                <div className="inv-grid">
                    {resources.map(r => (
                        <div key={r.key} className="inv-item">
                            <div className="inv-icon">{r.icon}</div>
                            <div className="inv-count">{r.count}</div>
                            <div className="inv-name">{r.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--gold)', marginTop: '4px' }}>单价 {r.price} 💰</div>
                            {r.count > 0 && (
                                <div className="mt-2" style={{ display: 'flex', gap: '4px' }}>
                                    <input type="number" min="1" max={r.count} value={sellAmount[r.key] || ''}
                                        onChange={e => setSellAmount(prev => ({ ...prev, [r.key]: e.target.value }))}
                                        className="form-control" style={{ padding: '4px 6px', fontSize: '12px', width: '50px', textAlign: 'center' }} placeholder="1" />
                                    <button className="btn-gold" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleSell(r.key)}>卖出</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <div className="game-section">
                <h2>📊 统计数据</h2>
                <div className="row g-3">
                    {[
                        { label: '总收获次数', value: gameData.stats.totalHarvests, icon: '🌾' },
                        { label: '总收取次数', value: gameData.stats.totalAnimalCollects, icon: '🥚' },
                        { label: '总交易次数', value: gameData.stats.totalTrades, icon: '🤝' },
                        { label: '总金币收入', value: gameData.stats.totalGoldEarned, icon: '💰' },
                    ].map(s => (
                        <div key={s.label} className="col-6 col-md-3">
                            <div className="stat-card">
                                <div style={{ fontSize: '28px', marginBottom: '4px' }}>{s.icon}</div>
                                <div className="stat-value">{s.value}</div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
