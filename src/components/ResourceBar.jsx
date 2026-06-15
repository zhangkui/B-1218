import React, { useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';

export default function ResourceBar() {
    const { gameData, config } = useGame();
    if (!gameData || !config) return null;
    const r = gameData.resources;
    const expNeeded = gameData.level * config.expPerLevel;
    const expPct = Math.min(100, (gameData.experience / expNeeded) * 100);
    const energyPct = Math.min(100, (r.energy / config.energy.max) * 100);

    return (
        <div className="resource-bar">
            <div className="resource-item level">
                <span className="icon">⭐</span>
                <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>等级</div>
                    <span className="value">{gameData.level}</span>
                    <div className="exp-bar" style={{ width: '60px' }}><div className="exp-fill" style={{ width: `${expPct}%` }} /></div>
                </div>
            </div>
            <div className="resource-item">
                <span className="icon">💰</span>
                <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>金币</div>
                    <span className="value">{Math.floor(r.gold)}</span>
                </div>
            </div>
            <div className="resource-item energy">
                <span className="icon">⚡</span>
                <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>体力</div>
                    <span className="value">{Math.floor(r.energy)}/{config.energy.max}</span>
                    <div className="exp-bar" style={{ width: '50px' }}><div className="exp-fill" style={{ width: `${energyPct}%`, background: 'linear-gradient(90deg,#1e3a5f,#60a5fa)' }} /></div>
                </div>
            </div>
            <div className="resource-item diamond">
                <span className="icon">💎</span>
                <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>钻石</div>
                    <span className="value">{r.diamond}</span>
                </div>
            </div>
        </div>
    );
}
