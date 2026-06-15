import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { animateStaggerIn, animateGoldGain } from '../utils/animations';

export default function PastureView() {
    const { gameData, config, buyAnimal, collectAnimal } = useGame();
    const [selectedAnimal, setSelectedAnimal] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => { if (containerRef.current) animateStaggerIn('.animal-card', containerRef.current); }, [gameData?.pasture?.animals?.length]);

    if (!gameData || !config) return null;

    const getTimeLeft = (pen) => {
        if (!pen.type || !pen.lastCollect) return '';
        const ac = config.animals[pen.type];
        const elapsed = (Date.now() - new Date(pen.lastCollect).getTime()) / 1000;
        const left = Math.max(0, ac.produceTime - elapsed);
        if (left <= 0) return '可收取';
        const m = Math.floor(left / 60), s = Math.floor(left % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getProgress = (pen) => {
        if (!pen.type || !pen.lastCollect) return 0;
        const ac = config.animals[pen.type];
        const elapsed = (Date.now() - new Date(pen.lastCollect).getTime()) / 1000;
        return Math.min(100, (elapsed / ac.produceTime) * 100);
    };

    const handleClick = async (pen, idx) => {
        if (pen.type && pen.isReady) {
            await collectAnimal(idx);
            if (containerRef.current) animateGoldGain(containerRef.current, `+${config.animals[pen.type]?.sellPrice || 0} 💰`);
        } else if (!pen.type && selectedAnimal) {
            await buyAnimal(idx, selectedAnimal);
        }
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <div className="game-section">
                <h2>🐄 我的牧场 <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}>({gameData.pasture.animals.length} 栏位)</span></h2>
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>购买动物：</div>
                    <div className="d-flex gap-2 flex-wrap">
                        {Object.entries(config.animals).map(([key, animal]) => (
                            <button key={key} className={`shop-item`}
                                onClick={() => setSelectedAnimal(selectedAnimal === key ? null : key)}
                                style={{
                                    padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', minWidth: 'auto',
                                    ...(selectedAnimal === key ? { borderColor: 'var(--blue)', background: 'rgba(96,165,250,0.1)' } : {})
                                }}>
                                <span>{animal.icon}</span>
                                <span style={{ fontSize: '13px' }}>{animal.name}</span>
                                <span style={{ fontSize: '11px', color: 'var(--gold)' }}>💰{animal.buyPrice}</span>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="animal-grid">
                    {gameData.pasture.animals.map((pen, idx) => (
                        <div key={idx} className={`animal-card ${pen.type ? (pen.isReady ? 'ready' : '') : 'empty'}`}
                            onClick={() => handleClick(pen, idx)}>
                            {pen.type ? (
                                <>
                                    <span className="animal-icon">{config.animals[pen.type]?.icon || '🐾'}</span>
                                    <div style={{ fontWeight: 600 }}>{config.animals[pen.type]?.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>产出：{config.animals[pen.type]?.productName}</div>
                                    <div className="plot-timer">{getTimeLeft(pen)}</div>
                                    <div className="progress-bar-custom" style={{ width: '100%' }}>
                                        <div className="progress-bar-fill" style={{ width: `${getProgress(pen)}%`, background: 'linear-gradient(90deg,#1e3a5f,#60a5fa)' }} />
                                    </div>
                                    {pen.isReady && <div style={{ color: 'var(--gold)', fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>🎯 点击收取</div>}
                                </>
                            ) : (
                                <>
                                    <span className="animal-icon" style={{ opacity: 0.3 }}>🐾</span>
                                    <div className="plot-label">{selectedAnimal ? '点击放入' : '空栏位 - 选择动物'}</div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
