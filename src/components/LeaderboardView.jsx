import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useGame } from '../context/GameContext';
import { animateStaggerIn } from '../utils/animations';

export default function LeaderboardView() {
    const [list, setList] = useState([]);
    const { addLog } = useGame();

    useEffect(() => {
        api.getLeaderboard().then(d => setList(d.leaderboard)).catch(e => addLog(e.message, 'error'));
    }, []);

    return (
        <div>
            <div className="game-section">
                <h2>🏆 排行榜</h2>
                <div className="game-card">
                    {list.map(p => (
                        <div key={p.rank} className="lb-row">
                            <span className={`lb-rank ${p.rank === 1 ? 'gold' : p.rank === 2 ? 'silver' : p.rank === 3 ? 'bronze' : ''}`}>
                                {p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : `#${p.rank}`}
                            </span>
                            <div style={{ flex: 1, marginLeft: '12px' }}>
                                <div style={{ fontWeight: 600 }}>{p.username}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Lv.{p.level} | 💰 {p.gold}</div>
                            </div>
                        </div>
                    ))}
                    {list.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>暂无排行数据</div>}
                </div>
            </div>
        </div>
    );
}
