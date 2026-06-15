import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import { getSocket } from '../services/socket';

export default function SocialView() {
    const { user } = useAuth();
    const { gameData, config } = useGame();
    const [messages, setMessages] = useState([]);
    const [onlinePlayers, setOnlinePlayers] = useState([]);
    const [input, setInput] = useState('');
    const [tradeTarget, setTradeTarget] = useState(null);
    const [tradeForm, setTradeForm] = useState({ offerResource: 'gold', offerAmount: 10, requestResource: 'gold', requestAmount: 10 });
    const [incomingTrade, setIncomingTrade] = useState(null);
    const [tradeMsg, setTradeMsg] = useState('');
    const msgEndRef = useRef(null);
    const socket = getSocket();

    useEffect(() => {
        if (!socket) return;
        const onHistory = (msgs) => setMessages(msgs);
        const onMsg = (msg) => setMessages(prev => [...prev.slice(-99), msg]);
        const onOnline = (list) => setOnlinePlayers(list);
        const onTradeIn = (data) => setIncomingTrade(data);
        const onTradeComplete = (data) => { setTradeMsg(data.message); setTradeTarget(null); setTimeout(() => setTradeMsg(''), 3000); };
        const onTradeReject = (data) => { setTradeMsg(data.message); setTimeout(() => setTradeMsg(''), 3000); };
        const onTradeErr = (msg) => { setTradeMsg(msg); setTimeout(() => setTradeMsg(''), 3000); };

        socket.on('chatHistory', onHistory);
        socket.on('chatMessage', onMsg);
        socket.on('onlinePlayers', onOnline);
        socket.on('tradeIncoming', onTradeIn);
        socket.on('tradeCompleted', onTradeComplete);
        socket.on('tradeRejected', onTradeReject);
        socket.on('tradeError', onTradeErr);
        socket.on('tradeSent', (data) => { setTradeMsg(data.message); setTimeout(() => setTradeMsg(''), 3000); });

        // 主动请求在线玩家列表（修复组件挂载时错过广播的问题）
        socket.emit('getOnlinePlayers');

        return () => {
            socket.off('chatHistory', onHistory); socket.off('chatMessage', onMsg);
            socket.off('onlinePlayers', onOnline); socket.off('tradeIncoming', onTradeIn);
            socket.off('tradeCompleted', onTradeComplete); socket.off('tradeRejected', onTradeReject);
            socket.off('tradeError', onTradeErr); socket.off('tradeSent');
        };
    }, [socket]);

    useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

    const sendMsg = () => {
        if (!input.trim() || !socket) return;
        socket.emit('sendMessage', input.trim());
        setInput('');
    };

    const sendTrade = () => {
        if (!socket || !tradeTarget) return;
        socket.emit('tradeRequest', { targetUserId: tradeTarget.userId, ...tradeForm });
        setTradeTarget(null);
    };

    const resourceOptions = config ? [
        { value: 'gold', label: '💰 金币' }, { value: 'diamond', label: '💎 钻石' },
        ...Object.entries(config.crops).map(([k, c]) => ({ value: k, label: `${c.icon} ${c.name}` })),
        ...Object.entries(config.animals).map(([, a]) => ({ value: a.product, label: `${a.icon} ${a.productName}` }))
    ] : [];

    return (
        <div>
            <div className="game-section">
                <h2>👥 联机互动</h2>
                {tradeMsg && <div style={{ padding: '10px 16px', background: 'rgba(74,222,128,0.1)', border: '1px solid var(--green)', borderRadius: 'var(--radius-xs)', marginBottom: '12px', color: 'var(--green)', fontSize: '14px' }}>{tradeMsg}</div>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', minHeight: '500px' }}>
                    {/* Chat */}
                    <div className="chat-box">
                        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: '15px' }}>💬 聊天室</div>
                        <div className="chat-messages">
                            {messages.map((m, i) => (
                                <div key={i} className={`chat-msg ${m.type === 'system' || m.type === 'trade' ? 'system' : m.sender === user?.username ? 'self' : 'other'}`}>
                                    {m.type === 'chat' && <div className="sender">{m.sender}</div>}
                                    <div className="content">{m.content}</div>
                                    <div className="time">{new Date(m.createdAt).toLocaleTimeString()}</div>
                                </div>
                            ))}
                            <div ref={msgEndRef} />
                        </div>
                        <div className="chat-input">
                            <input className="form-control" value={input} onChange={e => setInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && sendMsg()} placeholder="输入消息..." maxLength={500} />
                            <button className="btn-farm" onClick={sendMsg} style={{ padding: '8px 16px' }}>发送</button>
                        </div>
                    </div>
                    {/* Online Players */}
                    <div className="online-panel">
                        <h4>🟢 在线玩家 ({onlinePlayers.length})</h4>
                        {onlinePlayers.map(p => (
                            <div key={p.userId} className="online-user">
                                <div><span className="online-dot" />{p.username}</div>
                                {p.userId !== user?.id && (
                                    <button className="btn-farm-outline" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={() => setTradeTarget(p)}>交易</button>
                                )}
                            </div>
                        ))}
                        {onlinePlayers.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>暂无其他玩家在线</div>}
                    </div>
                </div>
            </div>

            {/* Trade Modal */}
            {tradeTarget && (
                <div className="trade-modal" onClick={(e) => e.target === e.currentTarget && setTradeTarget(null)}>
                    <div className="trade-card">
                        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>🤝 与 {tradeTarget.username} 交易</h3>
                        <div className="mb-3">
                            <label className="form-label">我提供</label>
                            <div className="d-flex gap-2">
                                <select className="form-select" value={tradeForm.offerResource} onChange={e => setTradeForm(f => ({ ...f, offerResource: e.target.value }))}>
                                    {resourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <input type="number" className="form-control" value={tradeForm.offerAmount} min={1}
                                    onChange={e => setTradeForm(f => ({ ...f, offerAmount: parseInt(e.target.value) || 0 }))} style={{ width: '80px' }} />
                            </div>
                        </div>
                        <div className="mb-3">
                            <label className="form-label">我需要</label>
                            <div className="d-flex gap-2">
                                <select className="form-select" value={tradeForm.requestResource} onChange={e => setTradeForm(f => ({ ...f, requestResource: e.target.value }))}>
                                    {resourceOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                                <input type="number" className="form-control" value={tradeForm.requestAmount} min={1}
                                    onChange={e => setTradeForm(f => ({ ...f, requestAmount: parseInt(e.target.value) || 0 }))} style={{ width: '80px' }} />
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn-farm flex-fill" onClick={sendTrade}>发起交易</button>
                            <button className="btn-farm-outline flex-fill" onClick={() => setTradeTarget(null)}>取消</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Incoming Trade */}
            {incomingTrade && (
                <div className="trade-modal">
                    <div className="trade-card">
                        <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>📨 收到交易请求</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '12px' }}>{incomingTrade.fromName} 想与你交易</p>
                        <div style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: 'var(--radius-xs)', marginBottom: '16px' }}>
                            <div className="d-flex justify-content-between mb-1">
                                <span>对方提供</span><span style={{ color: 'var(--green)' }}>{incomingTrade.offerResource} x{incomingTrade.offerAmount}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>对方需要</span><span style={{ color: 'var(--gold)' }}>{incomingTrade.requestResource} x{incomingTrade.requestAmount}</span>
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn-farm flex-fill" onClick={() => { socket.emit('tradeAccept', incomingTrade.tradeId); setIncomingTrade(null); }}>接受</button>
                            <button className="btn-danger-custom flex-fill" onClick={() => { socket.emit('tradeReject', incomingTrade.tradeId); setIncomingTrade(null); }}>拒绝</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
