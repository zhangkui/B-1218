import React, { useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { animateStaggerIn, animatePulse } from '../utils/animations';

export default function BuildingView() {
    const { gameData, config, upgrade } = useGame();
    const ref = useRef(null);
    useEffect(() => { if (ref.current) animateStaggerIn('.building-card', ref.current); }, []);

    if (!gameData || !config) return null;

    const getBuildingDesc = (key, lv) => {
        const b = config.buildings[key];
        switch (key) {
            case 'farmland': return `农田数量：${b.basePlots + (lv - 1) * b.plotsPerLevel} → ${b.basePlots + lv * b.plotsPerLevel}`;
            case 'pasture': return `栏位数量：${b.baseSlots + (lv - 1) * b.slotsPerLevel} → ${b.baseSlots + lv * b.slotsPerLevel}`;
            case 'warehouse': return `仓库容量：${b.baseCapacity + (lv - 1) * b.capacityPerLevel} → ${b.baseCapacity + lv * b.capacityPerLevel}`;
            case 'well': return `体力恢复：${(b.baseRegen + (lv - 1) * b.regenPerLevel).toFixed(1)}/分 → ${(b.baseRegen + lv * b.regenPerLevel).toFixed(1)}/分`;
            case 'mill': return `产出加成：${((b.baseBonus + (lv - 1) * b.bonusPerLevel) * 100).toFixed(0)}% → ${((b.baseBonus + lv * b.bonusPerLevel) * 100).toFixed(0)}%`;
            default: return '';
        }
    };

    const handleUpgrade = async (key, el) => {
        await upgrade(key);
        animatePulse(el);
    };

    return (
        <div ref={ref}>
            <div className="game-section">
                <h2>🏗️ 建筑管理</h2>
                <div className="building-grid">
                    {Object.entries(config.buildings).map(([key, b]) => {
                        const lv = gameData.buildings[key]?.level || 1;
                        const cost = b.baseCost * lv;
                        const isMax = lv >= b.maxLevel;
                        return (
                            <div key={key} className="building-card" id={`building-${key}`}>
                                <div className="d-flex align-items-center gap-3 mb-2">
                                    <span className="bld-icon">{b.icon}</span>
                                    <div>
                                        <div className="bld-name">{b.name}</div>
                                        <div className="bld-level">Lv.{lv}/{b.maxLevel}</div>
                                    </div>
                                </div>
                                <div className="progress-bar-custom mb-2">
                                    <div className="progress-bar-fill" style={{ width: `${(lv / b.maxLevel) * 100}%` }} />
                                </div>
                                {!isMax && <div className="bld-desc">{getBuildingDesc(key, lv)}</div>}
                                {isMax ? (
                                    <div style={{ color: 'var(--gold)', fontSize: '13px', fontWeight: 600, marginTop: '8px' }}>✅ 已满级</div>
                                ) : (
                                    <button className="btn-gold w-100 mt-2" style={{ fontSize: '13px' }}
                                        onClick={(e) => handleUpgrade(key, e.currentTarget.closest('.building-card'))}
                                        disabled={gameData.resources.gold < cost}>
                                        升级 💰{cost}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
