import { Router } from 'express';
import GameData from '../models/GameData.js';
import { auth } from '../middleware.js';
import { GAME_CONFIG, SEASONS, WEATHERS, SEASON_ORDER, SEASON_DURATION, WEATHER_CHANGE_INTERVAL, WEATHER_WEIGHTS, WITHER_CHECK_INTERVAL } from '../config.js';
import { applyTaskProgress } from '../services/taskService.js';
import { applyAchievementProgress } from '../services/achievementService.js';

const router = Router();

function checkLevelUp(gd) {
    let leveled = false;
    while (gd.level < GAME_CONFIG.maxLevel && gd.experience >= gd.level * GAME_CONFIG.expPerLevel) {
        gd.experience -= gd.level * GAME_CONFIG.expPerLevel;
        gd.level += 1; leveled = true;
    }
    return leveled;
}

function pickWeatherBySeason(seasonKey) {
    const weights = WEATHER_WEIGHTS[seasonKey];
    if (!weights) return 'sunny';
    const r = Math.random();
    let cumulative = 0;
    for (const [weather, weight] of Object.entries(weights)) {
        cumulative += weight;
        if (r <= cumulative) return weather;
    }
    return 'sunny';
}

function updateSeasonAndWeather(gd) {
    const now = new Date();
    const seasonElapsed = (now - new Date(gd.season.startedAt)) / 1000;
    if (seasonElapsed >= SEASON_DURATION) {
        const curIdx = SEASON_ORDER.indexOf(gd.season.current);
        const nextIdx = (curIdx + 1) % SEASON_ORDER.length;
        gd.season.current = SEASON_ORDER[nextIdx];
        gd.season.startedAt = now;
        gd.weather.current = pickWeatherBySeason(gd.season.current);
        gd.weather.changedAt = now;
    }
    const weatherElapsed = (now - new Date(gd.weather.changedAt)) / 1000;
    if (weatherElapsed >= WEATHER_CHANGE_INTERVAL) {
        gd.weather.current = pickWeatherBySeason(gd.season.current);
        gd.weather.changedAt = now;
    }
}

function updatePlotGrowth(plot, season, weather) {
    if (!plot.crop || !plot.plantedAt || plot.state === 'withered') return;
    const now = new Date();
    const cc = GAME_CONFIG.crops[plot.crop];
    if (!cc) return;

    const seasonCfg = SEASONS[season];
    const weatherCfg = WEATHERS[weather];

    const growMultiplier = seasonCfg.growMultiplier * weatherCfg.growMultiplier;
    const elapsed = (now - new Date(plot.plantedAt)) / 1000;
    const effectiveProgress = elapsed * growMultiplier;
    plot.growProgress = Math.min(100, (effectiveProgress / cc.growTime) * 100);

    if (plot.growProgress >= 50 && plot.state === 'planted') {
        plot.state = 'growing';
    }
    if (plot.growProgress >= 100) {
        plot.isReady = true;
    }

    const lastCheck = plot.lastWitherCheck ? new Date(plot.lastWitherCheck) : new Date(plot.plantedAt);
    const sinceLastCheck = (now - lastCheck) / 1000;
    if (sinceLastCheck >= WITHER_CHECK_INTERVAL && !plot.isReady) {
        plot.lastWitherCheck = now;
        const witherChance = seasonCfg.witherChance + weatherCfg.witherChance;
        if (plot.waterLevel <= 0 && witherChance > 0) {
            if (Math.random() < witherChance) {
                plot.state = 'withered';
            }
        } else if (plot.waterLevel > 0) {
            plot.waterLevel = Math.max(0, plot.waterLevel - 1);
        }
    }
}

router.get('/data', auth, async (req, res) => {
    try {
        let gd = await GameData.findOne({ userId: req.user._id });
        if (!gd) gd = await GameData.createForUser(req.user._id);
        updateSeasonAndWeather(gd);
        const { earnings, offlineTime } = gd.calculateOfflineEarnings();
        if (offlineTime >= 60) {
            Object.entries(earnings).forEach(([k, v]) => {
                if (k === 'exp') gd.experience += v;
                else if (gd.resources[k] !== undefined) gd.resources[k] += v;
            });
        }
        gd.farm.plots.forEach(p => {
            if (p.state === 'withered') return;
            updatePlotGrowth(p, gd.season.current, gd.weather.current);
        });
        gd.pasture.animals.forEach(a => {
            if (a.type && a.lastCollect) { const c = GAME_CONFIG.animals[a.type]; if (c && (new Date() - a.lastCollect) / 1000 >= c.produceTime) a.isReady = true; }
        });
        checkLevelUp(gd); gd.lastOnline = new Date(); await gd.save();
        res.json({ gameData: gd, offlineEarnings: offlineTime >= 60 ? earnings : null, offlineTime, config: GAME_CONFIG });
    } catch (err) { console.error(err); res.status(500).json({ error: '获取数据失败' }); }
});

router.post('/till', auth, async (req, res) => {
    try {
        const { slotIndex } = req.body;
        const gd = await GameData.findOne({ userId: req.user._id });
        if (slotIndex < 0 || slotIndex >= gd.farm.plots.length) return res.status(400).json({ error: '无效位置' });
        const plot = gd.farm.plots[slotIndex];
        if (plot.state !== 'empty') return res.status(400).json({ error: '只能翻耕空地' });
        if (gd.resources.energy < GAME_CONFIG.energy.tillCost) return res.status(400).json({ error: '体力不足' });
        gd.resources.energy -= GAME_CONFIG.energy.tillCost;
        plot.state = 'tilled';
        gd.lastOnline = new Date(); await gd.save();
        res.json({ gameData: gd, message: '翻耕完成，可以播种了' });
    } catch (err) { res.status(500).json({ error: '翻耕失败' }); }
});

router.post('/plant', auth, async (req, res) => {
    try {
        const { slotIndex, cropType } = req.body;
        const gd = await GameData.findOne({ userId: req.user._id });
        const cc = GAME_CONFIG.crops[cropType];
        if (!cc) return res.status(400).json({ error: '无效作物' });
        if (slotIndex < 0 || slotIndex >= gd.farm.plots.length) return res.status(400).json({ error: '无效位置' });
        const plot = gd.farm.plots[slotIndex];
        if (plot.state !== 'tilled') return res.status(400).json({ error: '需要先翻耕土地' });
        if (gd.resources.gold < cc.buyPrice) return res.status(400).json({ error: '金币不足' });
        if (gd.resources.energy < GAME_CONFIG.energy.plantCost) return res.status(400).json({ error: '体力不足' });
        gd.resources.gold -= cc.buyPrice; gd.resources.energy -= GAME_CONFIG.energy.plantCost;
        plot.crop = cropType; plot.plantedAt = new Date(); plot.isReady = false;
        plot.state = 'planted'; plot.growProgress = 0; plot.waterLevel = 1;
        plot.lastWatered = new Date(); plot.lastWitherCheck = new Date();
        gd.stats.totalPlants += 1;
        gd.lastOnline = new Date(); await gd.save();
        try {
            await applyTaskProgress(req.user._id, 'plant', 1);
            await applyAchievementProgress(req.user._id, 'plant', 1);
        } catch (taskErr) {
            console.error('种植任务/成就进度更新失败:', taskErr);
        }
        res.json({ gameData: gd, message: `成功播种${cc.name}` });
    } catch (err) { res.status(500).json({ error: '种植失败' }); }
});

router.post('/water', auth, async (req, res) => {
    try {
        const { slotIndex } = req.body;
        const gd = await GameData.findOne({ userId: req.user._id });
        if (slotIndex < 0 || slotIndex >= gd.farm.plots.length) return res.status(400).json({ error: '无效位置' });
        const plot = gd.farm.plots[slotIndex];
        if (!plot.crop || plot.state === 'withered') return res.status(400).json({ error: '该地块无需浇水' });
        if (plot.waterLevel >= 3) return res.status(400).json({ error: '水分已充足' });
        if (gd.resources.energy < GAME_CONFIG.energy.waterCost) return res.status(400).json({ error: '体力不足' });
        gd.resources.energy -= GAME_CONFIG.energy.waterCost;
        plot.waterLevel += 1; plot.lastWatered = new Date();
        gd.lastOnline = new Date(); await gd.save();
        res.json({ gameData: gd, message: `浇水成功，水分等级 ${plot.waterLevel}/3` });
    } catch (err) { res.status(500).json({ error: '浇水失败' }); }
});

router.post('/harvest', auth, async (req, res) => {
    try {
        const { slotIndex } = req.body;
        const gd = await GameData.findOne({ userId: req.user._id });
        const plot = gd.farm.plots[slotIndex];
        if (!plot?.crop || !plot.isReady) return res.status(400).json({ error: '作物未成熟' });
        if (gd.resources.energy < GAME_CONFIG.energy.harvestCost) return res.status(400).json({ error: '体力不足' });
        const cc = GAME_CONFIG.crops[plot.crop];
        const bonus = 1 + (gd.buildings.mill.level - 1) * GAME_CONFIG.buildings.mill.bonusPerLevel;
        const gold = Math.floor(cc.sellPrice * bonus);
        gd.resources.energy -= GAME_CONFIG.energy.harvestCost;
        gd.resources.gold += gold; gd.resources[plot.crop] += 1;
        gd.experience += cc.exp; gd.stats.totalHarvests += 1; gd.stats.totalGoldEarned += gold;
        plot.crop = null; plot.plantedAt = null; plot.isReady = false;
        plot.state = 'empty'; plot.growProgress = 0; plot.waterLevel = 0;
        plot.lastWatered = null; plot.lastWitherCheck = null;
        const leveled = checkLevelUp(gd); gd.lastOnline = new Date(); await gd.save();
        try {
            await applyTaskProgress(req.user._id, 'harvest', 1);
            await applyAchievementProgress(req.user._id, 'harvest', 1);
        } catch (taskErr) {
            console.error('收获任务/成就进度更新失败:', taskErr);
        }
        res.json({ gameData: gd, message: `收获${cc.name}，+${gold}金币 +${cc.exp}经验`, leveled });
    } catch (err) { res.status(500).json({ error: '收获失败' }); }
});

router.post('/clear-withered', auth, async (req, res) => {
    try {
        const { slotIndex } = req.body;
        const gd = await GameData.findOne({ userId: req.user._id });
        if (slotIndex < 0 || slotIndex >= gd.farm.plots.length) return res.status(400).json({ error: '无效位置' });
        const plot = gd.farm.plots[slotIndex];
        if (plot.state !== 'withered') return res.status(400).json({ error: '该地块没有枯萎作物' });
        if (gd.resources.energy < GAME_CONFIG.energy.tillCost) return res.status(400).json({ error: '体力不足' });
        gd.resources.energy -= GAME_CONFIG.energy.tillCost;
        plot.crop = null; plot.plantedAt = null; plot.isReady = false;
        plot.state = 'empty'; plot.growProgress = 0; plot.waterLevel = 0;
        plot.lastWatered = null; plot.lastWitherCheck = null;
        gd.lastOnline = new Date(); await gd.save();
        res.json({ gameData: gd, message: '已清理枯萎作物' });
    } catch (err) { res.status(500).json({ error: '清理失败' }); }
});

router.post('/buy-animal', auth, async (req, res) => {
    try {
        const { slotIndex, animalType } = req.body;
        const gd = await GameData.findOne({ userId: req.user._id });
        const ac = GAME_CONFIG.animals[animalType];
        if (!ac) return res.status(400).json({ error: '无效动物' });
        if (slotIndex < 0 || slotIndex >= gd.pasture.animals.length) return res.status(400).json({ error: '无效位置' });
        const pen = gd.pasture.animals[slotIndex];
        if (pen.type) return res.status(400).json({ error: '栏位已有动物' });
        if (gd.resources.gold < ac.buyPrice) return res.status(400).json({ error: '金币不足' });
        gd.resources.gold -= ac.buyPrice; pen.type = animalType; pen.lastCollect = new Date(); pen.isReady = false;
        gd.lastOnline = new Date(); await gd.save();
        res.json({ gameData: gd, message: `购买${ac.name}成功` });
    } catch (err) { res.status(500).json({ error: '购买失败' }); }
});

router.post('/collect-animal', auth, async (req, res) => {
    try {
        const { slotIndex } = req.body;
        const gd = await GameData.findOne({ userId: req.user._id });
        const pen = gd.pasture.animals[slotIndex];
        if (!pen?.type) return res.status(400).json({ error: '无动物' });
        const ac = GAME_CONFIG.animals[pen.type];
        if ((new Date() - pen.lastCollect) / 1000 < ac.produceTime) return res.status(400).json({ error: '产品未就绪' });
        if (gd.resources.energy < GAME_CONFIG.energy.collectCost) return res.status(400).json({ error: '体力不足' });
        const bonus = 1 + (gd.buildings.mill.level - 1) * GAME_CONFIG.buildings.mill.bonusPerLevel;
        const gold = Math.floor(ac.sellPrice * bonus);
        gd.resources.energy -= GAME_CONFIG.energy.collectCost; gd.resources.gold += gold;
        gd.resources[ac.product] += 1; gd.experience += ac.exp;
        gd.stats.totalAnimalCollects += 1; gd.stats.totalGoldEarned += gold;
        pen.lastCollect = new Date(); pen.isReady = false;
        const leveled = checkLevelUp(gd); gd.lastOnline = new Date(); await gd.save();
        try {
            await applyTaskProgress(req.user._id, 'feed_collect', 1);
            await applyAchievementProgress(req.user._id, 'feed_collect', 1);
        } catch (taskErr) {
            console.error('养殖收取任务/成就进度更新失败:', taskErr);
        }
        res.json({ gameData: gd, message: `收获${ac.productName}，+${gold}金币 +${ac.exp}经验`, leveled });
    } catch (err) { res.status(500).json({ error: '收获失败' }); }
});

router.post('/upgrade', auth, async (req, res) => {
    try {
        const { buildingType } = req.body;
        const gd = await GameData.findOne({ userId: req.user._id });
        const bc = GAME_CONFIG.buildings[buildingType];
        if (!bc) return res.status(400).json({ error: '无效建筑' });
        const lv = gd.buildings[buildingType].level;
        if (lv >= bc.maxLevel) return res.status(400).json({ error: '已达最高等级' });
        const cost = bc.baseCost * lv;
        if (gd.resources.gold < cost) return res.status(400).json({ error: `需要 ${cost} 金币` });
        gd.resources.gold -= cost; gd.buildings[buildingType].level = lv + 1;
        if (buildingType === 'farmland') {
            const newMax = bc.basePlots + lv * bc.plotsPerLevel;
            while (gd.farm.plots.length < newMax) gd.farm.plots.push({
                slot: gd.farm.plots.length, state: 'empty', crop: null, plantedAt: null,
                growProgress: 0, isReady: false, waterLevel: 0, lastWatered: null, lastWitherCheck: null
            });
            gd.farm.maxPlots = newMax;
        }
        if (buildingType === 'pasture') {
            const newMax = bc.baseSlots + lv * bc.slotsPerLevel;
            while (gd.pasture.animals.length < newMax) gd.pasture.animals.push({ slot: gd.pasture.animals.length, type: null, lastCollect: null, isReady: false });
            gd.pasture.maxAnimals = newMax;
        }
        gd.lastOnline = new Date(); await gd.save();
        res.json({ gameData: gd, message: `${bc.name}升级到 Lv.${lv + 1}` });
    } catch (err) { res.status(500).json({ error: '升级失败' }); }
});

router.post('/sell', auth, async (req, res) => {
    try {
        const { resourceType, amount } = req.body;
        const gd = await GameData.findOne({ userId: req.user._id });
        if (!gd.resources.hasOwnProperty(resourceType) || ['gold', 'energy', 'diamond'].includes(resourceType))
            return res.status(400).json({ error: '无效资源类型' });
        const qty = Math.min(amount || 1, gd.resources[resourceType]);
        if (qty <= 0) return res.status(400).json({ error: '数量不足' });
        let price = 5;
        for (const c of Object.values(GAME_CONFIG.crops)) if (resourceType === Object.keys(GAME_CONFIG.crops).find(k => k === resourceType)) { price = c.sellPrice; break; }
        for (const [k, a] of Object.entries(GAME_CONFIG.animals)) if (a.product === resourceType) { price = a.sellPrice; break; }
        const total = qty * price;
        gd.resources[resourceType] -= qty; gd.resources.gold += total;
        gd.stats.totalGoldEarned += total; gd.lastOnline = new Date(); await gd.save();
        res.json({ gameData: gd, message: `出售成功，获得 ${total} 金币` });
    } catch (err) { res.status(500).json({ error: '出售失败' }); }
});

router.get('/leaderboard', auth, async (req, res) => {
    try {
        const data = await GameData.find().sort({ level: -1, experience: -1 }).limit(20).populate({ path: 'userId', select: 'username' });
        const list = data.map((d, i) => ({ rank: i + 1, username: d.userId?.username || '未知', level: d.level, gold: d.resources.gold }));
        res.json({ leaderboard: list });
    } catch (err) { res.status(500).json({ error: '获取排行榜失败' }); }
});

export default router;
