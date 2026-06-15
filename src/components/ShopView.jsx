import React from 'react';
import { useGame } from '../context/GameContext';

export default function ShopView() {
    const { gameData, config, plant, buyAnimal } = useGame();
    if (!gameData || !config) return null;

    return (
        <div>
            <div className="game-section">
                <h2>🏪 商店</h2>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-secondary)' }}>🌱 种子商店</h3>
                <div className="shop-grid mb-4">
                    {Object.entries(config.crops).map(([key, crop]) => (
                        <div key={key} className="shop-item">
                            <div className="item-icon">{crop.icon}</div>
                            <div className="item-name">{crop.name}种子</div>
                            <div className="item-price">💰 {crop.buyPrice} 金币</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                生长：{crop.growTime}秒 | 卖出：{crop.sellPrice}金币
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--blue)', marginTop: '2px' }}>经验 +{crop.exp}</div>
                        </div>
                    ))}
                </div>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-secondary)' }}>🐄 动物商店</h3>
                <div className="shop-grid mb-4">
                    {Object.entries(config.animals).map(([key, animal]) => (
                        <div key={key} className="shop-item">
                            <div className="item-icon">{animal.icon}</div>
                            <div className="item-name">{animal.name}</div>
                            <div className="item-price">💰 {animal.buyPrice} 金币</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                产出：{animal.productName} / {animal.produceTime}秒
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--green)', marginTop: '2px' }}>收益：{animal.sellPrice}金币 | 经验 +{animal.exp}</div>
                        </div>
                    ))}
                </div>
                <h3 style={{ fontSize: '16px', marginBottom: '12px', color: 'var(--text-secondary)' }}>🏗️ 建筑价格</h3>
                <div className="shop-grid">
                    {Object.entries(config.buildings).map(([key, b]) => {
                        const lv = gameData.buildings[key]?.level || 1;
                        return (
                            <div key={key} className="shop-item">
                                <div className="item-icon">{b.icon}</div>
                                <div className="item-name">{b.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>当前 Lv.{lv}/{b.maxLevel}</div>
                                {lv < b.maxLevel ? (
                                    <div className="item-price">升级费用：💰 {b.baseCost * lv}</div>
                                ) : (
                                    <div style={{ color: 'var(--gold)', fontSize: '12px' }}>已满级</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
