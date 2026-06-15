import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { useAuth } from './AuthContext';

const GameContext = createContext(null);

const SEASONS_CFG = {
    spring: { name: '春天', icon: '🌸', growMultiplier: 1.0, witherChance: 0, waterNeed: 1 },
    summer: { name: '夏天', icon: '☀️', growMultiplier: 1.3, witherChance: 0.15, waterNeed: 2 },
    autumn: { name: '秋天', icon: '🍂', growMultiplier: 0.8, witherChance: 0.05, waterNeed: 1 },
    winter: { name: '冬天', icon: '❄️', growMultiplier: 0.5, witherChance: 0.25, waterNeed: 1 }
};

const WEATHERS_CFG = {
    sunny: { name: '晴天', icon: '☀️', growMultiplier: 1.2, waterEffect: 0, witherChance: 0.1 },
    rainy: { name: '雨天', icon: '🌧️', growMultiplier: 0.8, waterEffect: 1, witherChance: 0 },
    drought: { name: '干旱', icon: '🏜️', growMultiplier: 0.6, waterEffect: 0, witherChance: 0.3 },
    coldwave: { name: '寒潮', icon: '🥶', growMultiplier: 0.3, waterEffect: 0, witherChance: 0.2 }
};

const SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter'];
const SEASON_DURATION = 120;
const WEATHER_CHANGE_INTERVAL = 30;
const WEATHER_WEIGHTS = {
    spring: { sunny: 0.5, rainy: 0.35, drought: 0.05, coldwave: 0.1 },
    summer: { sunny: 0.4, rainy: 0.2, drought: 0.35, coldwave: 0.05 },
    autumn: { sunny: 0.45, rainy: 0.35, drought: 0.1, coldwave: 0.1 },
    winter: { sunny: 0.2, rainy: 0.15, drought: 0.05, coldwave: 0.6 }
};

function pickWeatherBySeason(season) {
    const weights = WEATHER_WEIGHTS[season];
    if (!weights) return 'sunny';
    const r = Math.random();
    let cumulative = 0;
    for (const [weather, weight] of Object.entries(weights)) {
        cumulative += weight;
        if (r <= cumulative) return weather;
    }
    return 'sunny';
}

export function GameProvider({ children }) {
    const { user } = useAuth();
    const [gameData, setGameData] = useState(null);
    const [config, setConfig] = useState(null);
    const [logs, setLogs] = useState([]);
    const [offlineEarnings, setOfflineEarnings] = useState(null);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef(null);
    const weatherTimerRef = useRef(null);

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

    useEffect(() => {
        if (!gameData || !config) return;
        timerRef.current = setInterval(() => {
            setGameData(prev => {
                if (!prev) return prev;
                const now = new Date();
                const updated = JSON.parse(JSON.stringify(prev));
                const season = updated.season?.current || 'spring';
                const weather = updated.weather?.current || 'sunny';
                const seasonCfg = SEASONS_CFG[season];
                const weatherCfg = WEATHERS_CFG[weather];
                const growMultiplier = seasonCfg.growMultiplier * weatherCfg.growMultiplier;

                updated.farm.plots.forEach(p => {
                    if (p.state === 'withered' || !p.crop || !p.plantedAt) return;
                    const cc = config.crops[p.crop];
                    if (!cc) return;
                    const elapsed = (now - new Date(p.plantedAt)) / 1000;
                    const effectiveProgress = elapsed * growMultiplier;
                    p.growProgress = Math.min(100, (effectiveProgress / cc.growTime) * 100);
                    if (p.growProgress >= 50 && p.state === 'planted') p.state = 'growing';
                    if (p.growProgress >= 100) p.isReady = true;
                    if (weather === 'rainy' && p.crop && p.state !== 'withered') {
                        p.waterLevel = Math.min(3, (p.waterLevel || 0) + 0.02);
                    }
                });

                updated.pasture.animals.forEach(a => {
                    if (a.type && a.lastCollect && !a.isReady) {
                        const ac = config.animals[a.type];
                        if (ac && (now - new Date(a.lastCollect)) / 1000 >= ac.produceTime) a.isReady = true;
                    }
                });

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

    useEffect(() => {
        if (!gameData?.season || !gameData?.weather) return;
        weatherTimerRef.current = setInterval(() => {
            setGameData(prev => {
                if (!prev?.season || !prev?.weather) return prev;
                const now = new Date();
                const updated = JSON.parse(JSON.stringify(prev));
                const seasonElapsed = (now - new Date(updated.season.startedAt)) / 1000;
                if (seasonElapsed >= SEASON_DURATION) {
                    const curIdx = SEASON_ORDER.indexOf(updated.season.current);
                    const nextIdx = (curIdx + 1) % SEASON_ORDER.length;
                    updated.season.current = SEASON_ORDER[nextIdx];
                    updated.season.startedAt = now.toISOString();
                    updated.weather.current = pickWeatherBySeason(updated.season.current);
                    updated.weather.changedAt = now.toISOString();
                } else {
                    const weatherElapsed = (now - new Date(updated.weather.changedAt)) / 1000;
                    if (weatherElapsed >= WEATHER_CHANGE_INTERVAL) {
                        updated.weather.current = pickWeatherBySeason(updated.season.current);
                        updated.weather.changedAt = now.toISOString();
                    }
                }
                return updated;
            });
        }, 5000);
        return () => clearInterval(weatherTimerRef.current);
    }, [gameData?.season?.current]);

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
    const till = (slot) => doAction(api.till, slot);
    const water = (slot) => doAction(api.water, slot);
    const harvest = (slot) => doAction(api.harvest, slot);
    const clearWithered = (slot) => doAction(api.clearWithered, slot);
    const buyAnimal = (slot, type) => doAction(api.buyAnimal, slot, type);
    const collectAnimal = (slot) => doAction(api.collectAnimal, slot);
    const upgrade = (type) => doAction(api.upgrade, type);
    const sell = (res, amt) => doAction(api.sell, res, amt);

    const dismissOffline = () => setOfflineEarnings(null);

    return (
        <GameContext.Provider value={{
            gameData, config, logs, loading, offlineEarnings, dismissOffline,
            plant, till, water, harvest, clearWithered,
            buyAnimal, collectAnimal, upgrade, sell, addLog, loadData, setGameData
        }}>
            {children}
        </GameContext.Provider>
    );
}

export const useGame = () => useContext(GameContext);
