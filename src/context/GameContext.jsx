import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const GameContext = createContext(null);

export function GameProvider({ children }) {
    const { user } = useAuth();
    const [gameData, setGameData] = useState(null);
    const [config, setConfig] = useState(null);
    const [logs, setLogs] = useState([]);
    const [offlineEarnings, setOfflineEarnings] = useState(null);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);

    const addLog = useCallback((msg, type = 'info') => {
        setLogs(prev => [...prev.slice(-49), { id: Date.now(), msg, type, time: new Date().toLocaleTimeString() }]);
    }, []);

    const loadData = useCallback(async () => {
        try {
            const data = await api.getGameData();
            setGameData(data.gameData);
            setConfig(data.config);
            if (data.offlineEarnings) setOfflineEarnings(data.offlineEarnings);
            return data;
        } catch (err) { addLog(err.message, 'error'); }
        finally { setLoading(false); }
    }, [addLog]);

    useEffect(() => { if (user) loadData(); }, [user, loadData]);

    // 定时刷新状态（检查作物/动物是否就绪 + 体力恢复）
    useEffect(() => {
        if (!gameData || !config) return;
        timerRef.current = setInterval(() => {
            setGameData(prev => {
                if (!prev) return prev;
                const now = new Date();
                const updated = JSON.parse(JSON.stringify(prev));
                // 检查作物
                updated.farm.plots.forEach(p => {
                    if (p.crop && p.plantedAt && !p.isReady) {
                        const cc = config.crops[p.crop];
                        if (cc && (now - new Date(p.plantedAt)) / 1000 >= cc.growTime) p.isReady = true;
                    }
                });
                // 检查动物
                updated.pasture.animals.forEach(a => {
                    if (a.type && a.lastCollect && !a.isReady) {
                        const ac = config.animals[a.type];
                        if (ac && (now - new Date(a.lastCollect)) / 1000 >= ac.produceTime) a.isReady = true;
                    }
                });
                // 体力恢复
                const wellLv = updated.buildings.well.level;
                const regen = config.buildings.well.baseRegen + (wellLv - 1) * config.buildings.well.regenPerLevel;
                if (updated.resources.energy < config.energy.max) {
                    updated.resources.energy = Math.min(config.energy.max, updated.resources.energy + regen / 60);
                }
                return updated;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [gameData?.level, config]);

    const doAction = useCallback(async (actionFn, ...args) => {
        try {
            const data = await actionFn(...args);
            if (data.gameData) setGameData(data.gameData);
            if (data.message) addLog(data.message, data.leveled ? 'success' : 'info');
            if (data.leveled) addLog(`🎉 升级到 Lv.${data.gameData.level}！`, 'success');
            return data;
        } catch (err) { addLog(err.message, 'error'); throw err; }
    }, [addLog]);

    const plant = (slot, crop) => doAction(api.plant, slot, crop);
    const harvest = (slot) => doAction(api.harvest, slot);
    const buyAnimal = (slot, type) => doAction(api.buyAnimal, slot, type);
    const collectAnimal = (slot) => doAction(api.collectAnimal, slot);
    const upgrade = (type) => doAction(api.upgrade, type);
    const sell = (res, amt) => doAction(api.sell, res, amt);

    const dismissOffline = () => setOfflineEarnings(null);

    return (
        <GameContext.Provider value={{
            gameData, config, logs, loading, offlineEarnings, dismissOffline,
            plant, harvest, buyAnimal, collectAnimal, upgrade, sell, addLog, loadData
        }}>
            {children}
        </GameContext.Provider>
    );
}

export const useGame = () => useContext(GameContext);
