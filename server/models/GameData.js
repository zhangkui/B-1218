import mongoose from 'mongoose';
import { GAME_CONFIG } from '../config.js';

const plotSchema = new mongoose.Schema({
    slot: Number,
    crop: { type: String, default: null },
    plantedAt: { type: Date, default: null },
    isReady: { type: Boolean, default: false }
}, { _id: false });

const animalSchema = new mongoose.Schema({
    slot: Number,
    type: { type: String, default: null },
    lastCollect: { type: Date, default: null },
    isReady: { type: Boolean, default: false }
}, { _id: false });

const gameDataSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    resources: {
        gold: { type: Number, default: 100 },
        energy: { type: Number, default: 100 },
        diamond: { type: Number, default: 10 },
        wheat: { type: Number, default: 0 }, corn: { type: Number, default: 0 },
        carrot: { type: Number, default: 0 }, potato: { type: Number, default: 0 },
        strawberry: { type: Number, default: 0 }, watermelon: { type: Number, default: 0 },
        egg: { type: Number, default: 0 }, milk: { type: Number, default: 0 },
        meat: { type: Number, default: 0 }, wool: { type: Number, default: 0 }
    },
    farm: { plots: [plotSchema], maxPlots: { type: Number, default: 4 } },
    pasture: { animals: [animalSchema], maxAnimals: { type: Number, default: 2 } },
    buildings: {
        farmland: { level: { type: Number, default: 1 } },
        pasture: { level: { type: Number, default: 1 } },
        warehouse: { level: { type: Number, default: 1 } },
        well: { level: { type: Number, default: 1 } },
        mill: { level: { type: Number, default: 1 } }
    },
    lastOnline: { type: Date, default: Date.now },
    stats: {
        totalPlants: { type: Number, default: 0 },
        totalHarvests: { type: Number, default: 0 },
        totalAnimalCollects: { type: Number, default: 0 },
        totalTrades: { type: Number, default: 0 },
        totalGoldEarned: { type: Number, default: 0 }
    }
}, { timestamps: true });

gameDataSchema.statics.createForUser = async function (userId) {
    const plots = Array.from({ length: 4 }, (_, i) => ({ slot: i, crop: null, plantedAt: null, isReady: false }));
    const animals = Array.from({ length: 2 }, (_, i) => ({ slot: i, type: null, lastCollect: null, isReady: false }));
    return this.create({ userId, farm: { plots, maxPlots: 4 }, pasture: { animals, maxAnimals: 2 } });
};

gameDataSchema.methods.calculateOfflineEarnings = function () {
    const now = new Date();
    const offlineSeconds = Math.floor((now - (this.lastOnline || now)) / 1000);
    if (offlineSeconds < 60) return { earnings: {}, offlineTime: 0 };
    const effective = Math.min(offlineSeconds, 8 * 3600);
    const earnings = { gold: 0, exp: 0, energy: 0 };
    for (const a of this.pasture.animals) {
        if (a.type && GAME_CONFIG.animals[a.type]) {
            const c = GAME_CONFIG.animals[a.type];
            const cycles = Math.floor(effective / c.produceTime);
            if (cycles > 0) { earnings[c.product] = (earnings[c.product] || 0) + cycles; earnings.gold += cycles * c.sellPrice; earnings.exp += cycles * c.exp; }
        }
    }
    const wellLv = this.buildings.well.level;
    const regen = GAME_CONFIG.buildings.well.baseRegen + (wellLv - 1) * GAME_CONFIG.buildings.well.regenPerLevel;
    earnings.energy = Math.min(Math.floor((effective / 60) * regen), GAME_CONFIG.energy.max - this.resources.energy);
    return { earnings, offlineTime: offlineSeconds };
};

export default mongoose.model('GameData', gameDataSchema);
