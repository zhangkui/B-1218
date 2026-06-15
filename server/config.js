export const PLOT_STATES = {
    empty: 'empty',
    tilled: 'tilled',
    planted: 'planted',
    growing: 'growing',
    withered: 'withered'
};

export const SEASONS = {
    spring: { name: '春天', icon: '🌸', growMultiplier: 1.0, witherChance: 0, waterNeed: 1 },
    summer: { name: '夏天', icon: '☀️', growMultiplier: 1.3, witherChance: 0.15, waterNeed: 2 },
    autumn: { name: '秋天', icon: '🍂', growMultiplier: 0.8, witherChance: 0.05, waterNeed: 1 },
    winter: { name: '冬天', icon: '❄️', growMultiplier: 0.5, witherChance: 0.25, waterNeed: 1 }
};

export const WEATHERS = {
    sunny: { name: '晴天', icon: '☀️', growMultiplier: 1.2, waterEffect: 0, witherChance: 0.1 },
    rainy: { name: '雨天', icon: '🌧️', growMultiplier: 0.8, waterEffect: 1, witherChance: 0 },
    drought: { name: '干旱', icon: '🏜️', growMultiplier: 0.6, waterEffect: 0, witherChance: 0.3 },
    coldwave: { name: '寒潮', icon: '🥶', growMultiplier: 0.3, waterEffect: 0, witherChance: 0.2 }
};

export const SEASON_ORDER = ['spring', 'summer', 'autumn', 'winter'];
export const SEASON_DURATION = 120;

export const WEATHER_CHANGE_INTERVAL = 30;
export const WEATHER_WEIGHTS = {
    spring: { sunny: 0.5, rainy: 0.35, drought: 0.05, coldwave: 0.1 },
    summer: { sunny: 0.4, rainy: 0.2, drought: 0.35, coldwave: 0.05 },
    autumn: { sunny: 0.45, rainy: 0.35, drought: 0.1, coldwave: 0.1 },
    winter: { sunny: 0.2, rainy: 0.15, drought: 0.05, coldwave: 0.6 }
};

export const WITHER_CHECK_INTERVAL = 15;

export const GAME_CONFIG = {
    crops: {
        wheat: { name: '小麦', growTime: 30, buyPrice: 5, sellPrice: 10, exp: 5, icon: '🌾' },
        corn: { name: '玉米', growTime: 60, buyPrice: 10, sellPrice: 25, exp: 10, icon: '🌽' },
        carrot: { name: '胡萝卜', growTime: 90, buyPrice: 15, sellPrice: 40, exp: 15, icon: '🥕' },
        potato: { name: '土豆', growTime: 120, buyPrice: 20, sellPrice: 60, exp: 20, icon: '🥔' },
        strawberry: { name: '草莓', growTime: 180, buyPrice: 35, sellPrice: 100, exp: 30, icon: '🍓' },
        watermelon: { name: '西瓜', growTime: 300, buyPrice: 50, sellPrice: 200, exp: 50, icon: '🍉' }
    },
    animals: {
        chicken: { name: '鸡', produceTime: 60, product: 'egg', productName: '鸡蛋', sellPrice: 8, buyPrice: 50, exp: 3, icon: '🐔' },
        cow: { name: '牛', produceTime: 120, product: 'milk', productName: '牛奶', sellPrice: 20, buyPrice: 150, exp: 8, icon: '🐄' },
        pig: { name: '猪', produceTime: 180, product: 'meat', productName: '猪肉', sellPrice: 30, buyPrice: 200, exp: 12, icon: '🐷' },
        sheep: { name: '羊', produceTime: 150, product: 'wool', productName: '羊毛', sellPrice: 25, buyPrice: 180, exp: 10, icon: '🐑' }
    },
    buildings: {
        farmland: { name: '农田', icon: '🌾', basePlots: 4, plotsPerLevel: 2, baseCost: 100, maxLevel: 10 },
        pasture: { name: '牧场', icon: '🐄', baseSlots: 2, slotsPerLevel: 1, baseCost: 150, maxLevel: 8 },
        warehouse: { name: '仓库', icon: '📦', baseCapacity: 100, capacityPerLevel: 50, baseCost: 80, maxLevel: 10 },
        well: { name: '水井', icon: '💧', baseRegen: 1, regenPerLevel: 0.5, baseCost: 120, maxLevel: 5 },
        mill: { name: '磨坊', icon: '🏭', baseBonus: 0, bonusPerLevel: 0.1, baseCost: 200, maxLevel: 5 }
    },
    energy: { max: 100, regenRate: 1, plantCost: 5, harvestCost: 2, collectCost: 3, tillCost: 2, waterCost: 1 },
    expPerLevel: 100,
    maxLevel: 50,
    admin: { username: 'admin', password: 'admin123' }
};
