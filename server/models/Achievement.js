import mongoose from 'mongoose';

const achievementSchema = new mongoose.Schema({
    achievementType: {
        type: String,
        enum: ['plant', 'harvest', 'feed_collect'],
        required: true
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: '🏆' },
    targetCount: { type: Number, default: 1, min: 1 },
    rewards: {
        gold: { type: Number, default: 0, min: 0 },
        diamond: { type: Number, default: 0, min: 0 },
        exp: { type: Number, default: 0, min: 0 },
        energy: { type: Number, default: 0, min: 0 }
    },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

achievementSchema.statics.initializeDefaults = async function () {
    const defaults = [
        {
            achievementType: 'plant',
            name: '初露锋芒',
            description: '累计种植10次作物',
        icon: '🌱',
            targetCount: 10,
            rewards: { gold: 200, diamond: 10, exp: 50, energy: 0 },
            sortOrder: 1
        },
        {
            achievementType: 'plant',
            name: '种植达人',
            description: '累计种植50次作物',
        icon: '🌿',
            targetCount: 50,
            rewards: { gold: 500, diamond: 25, exp: 150, energy: 0 },
            sortOrder: 2
        },
        {
            achievementType: 'plant',
            name: '绿手指',
            description: '累计种植200次作物',
            icon: '🌳',
            targetCount: 200,
            rewards: { gold: 1000, diamond: 50, exp: 400, energy: 0 },
            sortOrder: 3
        },
        {
            achievementType: 'harvest',
            name: '收获新手',
            description: '累计收获10次作物',
            icon: '🌾',
            targetCount: 10,
            rewards: { gold: 250, diamond: 10, exp: 60, energy: 0 },
            sortOrder: 4
        },
        {
            achievementType: 'harvest',
            name: '丰收使者',
            description: '累计收获50次作物',
            icon: '🧺',
            targetCount: 50,
            rewards: { gold: 600, diamond: 30, exp: 180, energy: 0 },
            sortOrder: 5
        },
        {
            achievementType: 'harvest',
            name: '粮仓满溢',
            description: '累计收获200次作物',
            icon: '🏺',
            targetCount: 200,
            rewards: { gold: 1200, diamond: 60, exp: 500, energy: 0 },
            sortOrder: 6
        },
        {
            achievementType: 'feed_collect',
            name: '牧场新手',
            description: '累计收取5次动物产品',
            icon: '🐔',
            targetCount: 5,
            rewards: { gold: 180, diamond: 8, exp: 40, energy: 0 },
            sortOrder: 7
        },
        {
            achievementType: 'feed_collect',
            name: '勤劳牧民',
            description: '累计收取30次动物产品',
            icon: '🐑',
            targetCount: 30,
            rewards: { gold: 450, diamond: 20, exp: 120, energy: 0 },
            sortOrder: 8
        },
        {
            achievementType: 'feed_collect',
            name: '牧场之王',
            description: '累计收取100次动物产品',
            icon: '🐄',
            targetCount: 100,
            rewards: { gold: 900, diamond: 45, exp: 350, energy: 0 },
            sortOrder: 9
        }
    ];
    for (const def of defaults) {
        const exists = await this.findOne({ achievementType: def.achievementType, targetCount: def.targetCount });
        if (!exists) await this.create(def);
    }
};

export default mongoose.model('Achievement', achievementSchema);
