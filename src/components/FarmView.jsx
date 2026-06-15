import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { animateGoldGain, animateStaggerIn, animatePulse } from '../utils/animations';

export default function FarmView() {
    const { gameData, config, plant, harvest } = useGame();
    const [selectedCrop, setSelectedCrop] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => { if (containerRef.current) animateStaggerIn('.plot-card', containerRef.current); }, [gameData?.farm?.plots?.length]);

    if (!gameData || !config) return null;

    const getTimeLeft = (plot) => {
        if (!plot.crop || !plot.plantedAt) return '';
        const cc = config.crops[plot.crop];
        const elapsed = (Date.now() - new Date(plot.plantedAt).getTime()) / 1000;
        const left = Math.max(0, cc.growTime - elapsed);
        if (left <= 0) return '已成熟';
        const m = Math.floor(left / 60), s = Math.floor(left % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getProgress = (plot) => {
        if (!plot.crop || !plot.plantedAt) return 0;
        const cc = config.crops[plot.crop];
        const elapsed = (Date.now() - new Date(plot.plantedAt).getTime()) / 1000;
        return Math.min(100, (elapsed / cc.growTime) * 100);
    };

    const handlePlotClick = async (plot, idx) => {
        if (plot.crop && plot.isReady) {
            await harvest(idx);
            if (containerRef.current) animateGoldGain(containerRef.current, `+${config.crops[plot.crop]?.sellPrice || 0} 💰`);
        } else if (!plot.crop && selectedCrop) {
            await plant(idx, selectedCrop);
        }
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <div className="game-section">
                <h2>🌾 我的农田 <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}>({gameData.farm.plots.length} 块)</span></h2>
                {/* 种子选择 */}
                <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>选择种子：</div>
                    <div className="d-flex gap-2 flex-wrap">
                        {Object.entries(config.crops).map(([key, crop]) => (
                            <button key={key} className={`shop-item ${selectedCrop === key ? 'border-success' : ''}`}
                                onClick={() => setSelectedCrop(selectedCrop === key ? null : key)}
                                style={{
                                    padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px', minWidth: 'auto',
                                    ...(selectedCrop === key ? { borderColor: 'var(--green)', background: 'rgba(74,222,128,0.1)' } : {})
                                }}>
                                <span>{crop.icon}</span>
                                <span style={{ fontSize: '13px' }}>{crop.name}</span>
                                <span style={{ fontSize: '11px', color: 'var(--gold)' }}>💰{crop.buyPrice}</span>
                            </button>
                        ))}
                    </div>
                </div>
                {/* 农田格子 */}
                <div className="plot-grid">
                    {gameData.farm.plots.map((plot, idx) => (
                        <div key={idx} className={`plot-card ${plot.crop ? (plot.isReady ? 'ready' : '') : 'empty'}`}
                            onClick={() => handlePlotClick(plot, idx)}>
                            {plot.crop ? (
                                <>
                                    <span className="crop-icon">{config.crops[plot.crop]?.icon || '🌱'}</span>
                                    <div style={{ fontWeight: 600 }}>{config.crops[plot.crop]?.name}</div>
                                    <div className="plot-timer">{getTimeLeft(plot)}</div>
                                    <div className="progress-bar-custom" style={{ width: '100%' }}>
                                        <div className="progress-bar-fill" style={{ width: `${getProgress(plot)}%` }} />
                                    </div>
                                    {plot.isReady && <div style={{ color: 'var(--gold)', fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>🎯 点击收获</div>}
                                </>
                            ) : (
                                <>
                                    <span className="crop-icon" style={{ opacity: 0.3 }}>🌱</span>
                                    <div className="plot-label">{selectedCrop ? '点击种植' : '空地 - 选择种子'}</div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
