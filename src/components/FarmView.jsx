import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { animateGoldGain, animateStaggerIn } from '../utils/animations';

const SEASONS_MAP = {
    spring: { name: '春天', icon: '🌸', color: '#f9a8d4', growMul: 1.0 },
    summer: { name: '夏天', icon: '☀️', color: '#fbbf24', growMul: 1.3 },
    autumn: { name: '秋天', icon: '🍂', color: '#f97316', growMul: 0.8 },
    winter: { name: '冬天', icon: '❄️', color: '#93c5fd', growMul: 0.5 }
};

const WEATHERS_MAP = {
    sunny: { name: '晴天', icon: '☀️', desc: '生长加速', color: '#fbbf24', growMul: 1.2 },
    rainy: { name: '雨天', icon: '🌧️', desc: '自动浇水', color: '#60a5fa', growMul: 0.8 },
    drought: { name: '干旱', icon: '🏜️', desc: '枯萎风险高', color: '#f87171', growMul: 0.6 },
    coldwave: { name: '寒潮', icon: '🥶', desc: '生长缓慢', color: '#a78bfa', growMul: 0.3 }
};

const PLOT_STATE_DISPLAY = {
    empty: { icon: '🕳️', label: '空地', desc: '点击翻耕' },
    tilled: { icon: '🟫', label: '已翻耕', desc: '可以播种' },
    planted: { icon: '🌱', label: '已播种', desc: '正在发芽' },
    growing: { icon: '🌿', label: '长势良好', desc: '茁壮成长' },
    withered: { icon: '🥀', label: '枯萎', desc: '点击清理' }
};

export default function FarmView() {
    const { gameData, config, plant, till, water, harvest, clearWithered } = useGame();
    const [selectedCrop, setSelectedCrop] = useState(null);
    const [, setTick] = useState(0);
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) animateStaggerIn('.plot-card', containerRef.current);
    }, [gameData?.farm?.plots?.length]);

    useEffect(() => {
        const id = setInterval(() => setTick(t => t + 1), 1000);
        return () => clearInterval(id);
    }, []);

    if (!gameData || !config) return null;

    const season = gameData.season?.current || 'spring';
    const weather = gameData.weather?.current || 'sunny';
    const seasonCfg = SEASONS_MAP[season];
    const weatherCfg = WEATHERS_MAP[weather];

    const now = Date.now();

    const seasonElapsed = gameData.season?.startedAt ? (now - new Date(gameData.season.startedAt).getTime()) / 1000 : 0;
    const seasonTotal = 120;
    const seasonRemain = Math.max(0, seasonTotal - seasonElapsed);
    const seasonRemainMin = Math.floor(seasonRemain / 60);
    const seasonRemainSec = Math.floor(seasonRemain % 60);

    const weatherElapsed = gameData.weather?.changedAt ? (now - new Date(gameData.weather.changedAt).getTime()) / 1000 : 0;
    const weatherTotal = 30;
    const weatherRemain = Math.max(0, weatherTotal - weatherElapsed);
    const weatherRemainSec = Math.floor(weatherRemain);

    const getEffectiveGrowTime = (cropKey) => {
        const cc = config.crops[cropKey];
        if (!cc) return 0;
        const sMul = SEASONS_MAP[season]?.growMul || 1;
        const wMul = WEATHERS_MAP[weather]?.growMul || 1;
        return Math.ceil(cc.growTime / (sMul * wMul));
    };

    const getTimeLeft = (plot) => {
        if (!plot.crop || !plot.plantedAt || plot.state === 'withered') return '';
        if (plot.isReady) return '已成熟';
        const cc = config.crops[plot.crop];
        if (!cc) return '';
        const sMul = SEASONS_MAP[season]?.growMul || 1;
        const wMul = WEATHERS_MAP[weather]?.growMul || 1;
        const growMultiplier = sMul * wMul;
        const progress = plot.growProgress || 0;
        const remainingProgress = 100 - progress;
        const progressPerSecond = (100 / cc.growTime) * growMultiplier;
        const left = remainingProgress / progressPerSecond;
        if (left <= 0) return '已成熟';
        const m = Math.floor(left / 60), s = Math.floor(left % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getProgress = (plot) => {
        if (!plot.crop || !plot.plantedAt || plot.state === 'withered') return 0;
        return Math.min(100, plot.growProgress || 0);
    };

    const getProgressColor = (progress) => {
        if (progress >= 100) return 'var(--gold)';
        if (progress >= 50) return 'var(--green)';
        return '#60a5fa';
    };

    const handlePlotClick = async (plot, idx) => {
        if (plot.state === 'withered') {
            await clearWithered(idx);
            return;
        }
        if (plot.isReady && plot.crop) {
            try {
                await harvest(idx);
                if (containerRef.current) animateGoldGain(containerRef.current, `+${config.crops[plot.crop]?.sellPrice || 0} 💰`);
            } catch (e) {
                setTimeout(() => setTick(t => t + 1), 200);
            }
            return;
        }
        if (plot.state === 'empty') {
            await till(idx);
            return;
        }
        if (plot.state === 'tilled' && selectedCrop) {
            await plant(idx, selectedCrop);
            return;
        }
    };

    const handleWater = async (e, idx) => {
        e.stopPropagation();
        try {
            await water(idx);
        } catch (e) {
            setTimeout(() => setTick(t => t + 1), 200);
        }
    };

    const renderWaterDots = (waterLevel) => {
        const lvl = Math.floor(waterLevel || 0);
        return (
            <div style={{ display: 'flex', gap: '3px', justifyContent: 'center', marginTop: '2px' }}>
                {[0, 1, 2].map(i => (
                    <span key={i} style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: i < lvl ? '#60a5fa' : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.3s'
                    }} />
                ))}
            </div>
        );
    };

    return (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <div className="game-section">
                <h2>🌾 我的农田 <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}>({gameData.farm.plots.length} 块)</span></h2>

                <div className="weather-season-bar">
                    <div className="season-info" style={{ borderColor: seasonCfg?.color || 'var(--border)' }}>
                        <span className="season-icon">{seasonCfg?.icon}</span>
                        <span className="season-name" style={{ color: seasonCfg?.color }}>{seasonCfg?.name}</span>
                        <span className="season-timer">{seasonRemainMin}:{seasonRemainSec.toString().padStart(2, '0')}</span>
                    </div>
                    <div className="weather-info" style={{ borderColor: weatherCfg?.color || 'var(--border)' }}>
                        <span className="weather-icon">{weatherCfg?.icon}</span>
                        <span className="weather-name" style={{ color: weatherCfg?.color }}>{weatherCfg?.name}</span>
                        <span className="weather-desc">{weatherCfg?.desc}</span>
                        <span className="weather-timer">{weatherRemainSec}s</span>
                    </div>
                </div>

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
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>~{getEffectiveGrowTime(key)}s</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="plot-grid">
                    {gameData.farm.plots.map((plot, idx) => {
                        const stateDisplay = PLOT_STATE_DISPLAY[plot.state || 'empty'];
                        const isReady = plot.isReady && plot.crop;
                        const isWithered = plot.state === 'withered';
                        const hasCrop = plot.crop && plot.state !== 'withered';

                        return (
                            <div key={idx}
                                className={`plot-card plot-${plot.state || 'empty'} ${isReady ? 'ready' : ''} ${isWithered ? 'withered' : ''}`}
                                onClick={() => handlePlotClick(plot, idx)}>
                                {hasCrop ? (
                                    <>
                                        <span className="crop-icon">{config.crops[plot.crop]?.icon || '🌱'}</span>
                                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{config.crops[plot.crop]?.name}</div>
                                        <div className="plot-state-tag" data-state={plot.state}>
                                            {stateDisplay?.label}
                                        </div>
                                        <div className="plot-timer">{getTimeLeft(plot)}</div>
                                        <div className="progress-bar-custom" style={{ width: '100%' }}>
                                            <div className="progress-bar-fill" style={{
                                                width: `${getProgress(plot)}%`,
                                                background: getProgressColor(getProgress(plot))
                                            }} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', justifyContent: 'center' }}>
                                            {renderWaterDots(plot.waterLevel)}
                                            {!isReady && (
                                                <button className="water-btn" onClick={(e) => handleWater(e, idx)}
                                                    title="浇水">
                                                    💧
                                                </button>
                                            )}
                                        </div>
                                        {isReady && <div style={{ color: 'var(--gold)', fontSize: '13px', fontWeight: 600, marginTop: '4px' }}>🎯 点击收获</div>}
                                    </>
                                ) : isWithered ? (
                                    <>
                                        <span className="crop-icon withered-icon">🥀</span>
                                        <div style={{ fontWeight: 600, color: 'var(--red)' }}>枯萎</div>
                                        <div className="plot-state-tag" data-state="withered">已枯萎</div>
                                        <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px' }}>点击清理</div>
                                    </>
                                ) : (
                                    <>
                                        <span className="crop-icon" style={{ opacity: 0.5 }}>{stateDisplay?.icon}</span>
                                        <div className="plot-state-tag" data-state={plot.state || 'empty'}>{stateDisplay?.label}</div>
                                        <div className="plot-label">{stateDisplay?.desc}</div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
