import React from 'react';
import { useGame } from '../context/GameContext';

export default function ActionLog() {
    const { logs } = useGame();
    if (logs.length === 0) return null;

    return (
        <div className="action-log">
            <h5>📋 操作日志</h5>
            <div style={{ display: 'flex', flexDirection: 'column-reverse' }}>
                {logs.slice(-20).reverse().map(log => (
                    <div key={log.id} className={`log-item ${log.type}`}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginRight: '6px' }}>{log.time}</span>
                        {log.msg}
                    </div>
                ))}
            </div>
        </div>
    );
}
