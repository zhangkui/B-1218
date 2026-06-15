# 🌾 你的农场 - 文字放置挂机游戏

一款基于 Web 的文字放置挂机游戏，支持种植、养殖、建筑升级、局域网联机互动等丰富玩法。

## 📋 功能特性

### 🎮 核心玩法
- **种植系统**：6种作物（小麦、玉米、胡萝卜、土豆、草莓、西瓜），不同生长时间和收益
- **养殖系统**：4种动物（鸡、牛、猪、羊），自动产出资源
- **建筑系统**：5种建筑（农田、牧场、仓库、水井、磨坊），可升级解锁更多功能
- **商店系统**：购买种子和动物，查看价格信息
- **仓库系统**：查看和出售收获的资源
- **离线收益**：离线期间动物继续产出，登录后自动结算（最长8小时）
- **等级系统**：通过收获获取经验，升级解锁更多内容
- **排行榜**：全服玩家等级排名

### 👥 联机功能
- **实时聊天**：WebSocket 实时通信，支持聊天室
- **在线玩家列表**：查看当前在线的其他玩家
- **资源交易**：与其他在线玩家进行资源交换
- **局域网手动连接**：同一局域网内多设备访问同一服务器

### 🔐 用户系统
- **注册/登录**：用户名密码认证，JWT Token 鉴权
- **密码修改**：支持修改密码
- **数据隔离**：每个用户独立的游戏数据
- **管理员账号**：预设管理员，拥有全局管理权限

### ⚙️ 管理员功能
- **用户管理**：查看所有用户、封禁/解封、删除、重置数据
- **系统统计**：总用户数、在线人数、平均等级、全服金币
- **资源赠送**：向指定用户赠送任意资源

### ✨ 动画效果
- GSAP 驱动的流畅动画
- 收获金币飘动特效
- 卡片弹入/淡入动画
- 页面切换过渡效果
- 成熟作物脉冲提示

## 🛠️ 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 18.3 |
| 构建工具 | Vite | 6.0 |
| CSS框架 | Bootstrap | 5.3 |
| 动画库 | GSAP | 3.12 |
| 后端框架 | Express | 4.21 |
| 实时通信 | Socket.IO | 4.8 |
| 数据库 | MongoDB | 7.x |
| ORM | Mongoose | 8.9 |
| 容器化 | Docker + Docker Compose | - |

## 🚀 快速开始

### Docker 部署（推荐）

```bash
# 1. 进入项目目录
cd label-1218

# 2. 启动服务
docker-compose up -d --build

# 3. 访问游戏
# 打开浏览器访问 http://localhost:1218
```

### 局域网联机

1. 在服务器所在机器上启动 Docker 服务
2. 查看服务器局域网 IP 地址（如 `192.168.1.100`）
3. 其他设备在浏览器中访问 `http://192.168.1.100:1218`
4. 各设备注册不同账号即可联机互动

### 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动 MongoDB（需要本地安装）
mongod

# 3. 启动开发服务器
npm run dev

# 4. 访问 http://localhost:5173
```

## 👤 预设账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123 |

> 普通用户请通过注册页面创建账号

## 📁 项目结构

```
label-1218/
├── docker-compose.yml          # Docker 编排配置
├── Dockerfile                  # 容器构建文件
├── package.json                # 项目依赖配置
├── vite.config.js              # Vite 构建配置
├── index.html                  # HTML 入口
├── README.md                   # 项目文档
├── server/                     # 后端服务
│   ├── index.js                # 服务入口
│   ├── config.js               # 游戏配置
│   ├── middleware.js            # JWT认证中间件
│   ├── models/                 # 数据模型
│   │   ├── User.js             # 用户模型
│   │   ├── GameData.js         # 游戏数据模型
│   │   └── Message.js          # 消息模型
│   ├── routes/                 # API路由
│   │   ├── auth.js             # 认证接口
│   │   ├── game.js             # 游戏接口
│   │   └── admin.js            # 管理接口
│   └── socket/                 # WebSocket
│       └── handler.js          # 实时通信处理
└── src/                        # 前端源码
    ├── main.jsx                # React 入口
    ├── App.jsx                 # 根组件
    ├── App.css                 # 全局样式
    ├── context/                # 状态管理
    │   ├── AuthContext.jsx     # 认证上下文
    │   └── GameContext.jsx     # 游戏上下文
    ├── services/               # 服务层
    │   ├── api.js              # API 请求
    │   └── socket.js           # Socket 连接
    ├── utils/                  # 工具函数
    │   └── animations.js       # GSAP 动画
    ├── pages/                  # 页面组件
    │   ├── LoginPage.jsx       # 登录页
    │   ├── RegisterPage.jsx    # 注册页
    │   ├── GamePage.jsx        # 游戏主页
    │   └── AdminPage.jsx       # 管理页
    └── components/             # UI 组件
        ├── Navbar.jsx          # 导航栏
        ├── ResourceBar.jsx     # 资源栏
        ├── FarmView.jsx        # 农田视图
        ├── PastureView.jsx     # 牧场视图
        ├── BuildingView.jsx    # 建筑视图
        ├── ShopView.jsx        # 商店视图
        ├── InventoryView.jsx   # 仓库视图
        ├── SocialView.jsx      # 联机互动
        ├── LeaderboardView.jsx # 排行榜
        └── ActionLog.jsx       # 操作日志
```

## 🎮 游戏指南

### 新手入门
1. 注册账号并登录
2. 在农田页面选择种子，点击空地种植
3. 等待作物成熟后点击收获获得金币
4. 用金币购买动物放入牧场，自动产出资源
5. 升级建筑解锁更多田地和栏位
6. 与在线玩家聊天交易

### 资源说明
- 💰 **金币**：主要货币，用于购买和升级
- ⚡ **体力**：操作消耗，随时间恢复（升级水井加速）
- 💎 **钻石**：稀有货币
- ⭐ **经验**：收获获取，升级角色

### 离线收益
- 动物在离线期间持续产出
- 最长计算 8 小时离线收益
- 登录后自动结算并弹窗展示

## 📝 API 接口

### 认证接口
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户
- `PUT /api/auth/password` - 修改密码

### 游戏接口
- `GET /api/game/data` - 获取游戏数据
- `POST /api/game/plant` - 种植作物
- `POST /api/game/harvest` - 收获作物
- `POST /api/game/buy-animal` - 购买动物
- `POST /api/game/collect-animal` - 收取动物产品
- `POST /api/game/upgrade` - 升级建筑
- `POST /api/game/sell` - 出售资源
- `GET /api/game/leaderboard` - 排行榜

### 管理接口
- `GET /api/admin/users` - 用户列表
- `GET /api/admin/stats` - 系统统计
- `PUT /api/admin/user/:id/ban` - 封禁/解封
- `POST /api/admin/grant` - 赠送资源
- `DELETE /api/admin/user/:id` - 删除用户
- `POST /api/admin/reset/:id` - 重置数据

### WebSocket 事件
- `sendMessage` - 发送聊天消息
- `chatMessage` - 接收聊天消息
- `onlinePlayers` - 在线玩家列表
- `tradeRequest` - 发起交易
- `tradeAccept/tradeReject` - 接受/拒绝交易
