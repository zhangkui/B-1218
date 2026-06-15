import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGame } from '../context/GameContext';
import Navbar from '../components/Navbar';
import ResourceBar from '../components/ResourceBar';
import FarmView from '../components/FarmView';
import PastureView from '../components/PastureView';
import BuildingView from '../components/BuildingView';
import ShopView from '../components/ShopView';
import InventoryView from '../components/InventoryView';
import SocialView from '../components/SocialView';
import LeaderboardView from '../components/LeaderboardView';
import TaskView from '../components/TaskView';
import ActionLog from '../components/ActionLog';
import AdminPage from './AdminPage';
import { animatePageTransition } from '../utils/animations';

const TABS = [
    { key: 'farm', label: '🌾 农田', component: FarmView },
    { key: 'pasture', label: '🐄 牧场', component: PastureView },
    { key: 'building', label: '🏗️ 建筑', component: BuildingView },
    { key: 'shop', label: '🏪 商店', component: ShopView },
    { key: 'inventory', label: '📦 仓库', component: InventoryView },
    { key: 'tasks', label: '📋 任务', component: TaskView, special: true },
    { key: 'social', label: '👥 联机', component: SocialView },
    { key: 'leaderboard', label: '🏆 排行', component: LeaderboardView },
];

export default function GamePage() {
    const { user } = useAuth();
    const { gameData, loading, offlineEarnings, dismissOffline, config, setGameData, addLog } = useGame();
    const [activeTab, setActiveTab] = useState('farm');
    const contentRef = useRef(null);

    useEffect(() => {
        if (contentRef.current) animatePageTransition(contentRef.current);
    }, [activeTab]);

    if (loading) return (
        <div className="loading-screen">
            <div className="spinner" />
            <div style={{ color: 'var(--text-secondary)' }}>正在加载农场数据...</div>
        </div>
    );

    const allTabs = [...TABS];
    if (user?.role === 'admin') allTabs.push({ key: 'admin', label: '⚙️ 管理', component: AdminPage });

    const activeTabConfig = allTabs.find(t => t.key === activeTab);
    const ActiveComponent = activeTabConfig?.component || FarmView;

    const handleTaskMessage = (msg, isError = false) => {
        addLog(msg, isError ? 'error' : 'success');
    };

    const renderComponent = () => {
        if (activeTabConfig?.special && activeTabConfig.key === 'tasks') {
            return <TaskView gameData={gameData} setGameData={setGameData} onMessage={handleTaskMessage} />;
        }
        return <ActiveComponent />;
    };

    return (
        <div>
            <Navbar />
            <div className="container" style={{ maxWidth: '1200px', paddingBottom: '80px' }}>
                <ResourceBar />
                <div className="nav-tab-bar">
                    {allTabs.map(tab => (
                        <button key={tab.key} className={`nav-tab ${activeTab === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div ref={contentRef}>
                    {renderComponent()}
                </div>
            </div>
            <ActionLog />

            {/* Offline Earnings Modal */}
            {offlineEarnings && (
                <div className="offline-modal" onClick={dismissOffline}>
                    <div className="offline-card" onClick={e => e.stopPropagation()}>
                        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🌙</div>
                        <h3>离线收益</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>你离开了一段时间，农场为你积累了收益</p>
                        <div className="earnings-list">
                            {Object.entries(offlineEarnings).filter(([, v]) => v > 0).map(([k, v]) => {
                                const labels = { gold: '💰 金币', exp: '⭐ 经验', energy: '⚡ 体力', egg: '🥚 鸡蛋', milk: '🥛 牛奶', meat: '🥩 猪肉', wool: '🧶 羊毛' };
                                return (
                                    <div key={k}>
                                        <span>{labels[k] || k}</span>
                                        <span style={{ color: 'var(--green)', fontWeight: 700 }}>+{v}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <button className="btn-farm w-100" onClick={dismissOffline}>太棒了！</button>
                    </div>
                </div>
            )}
        </div>
    );
}
