// 游戏核心配置
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
    energy: { max: 100, regenRate: 1, plantCost: 5, harvestCost: 2, collectCost: 3 },
    expPerLevel: 100,
    maxLevel: 50,
    admin: { username: 'admin', password: 'admin123' }
};
