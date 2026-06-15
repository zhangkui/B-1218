import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import GameData from '../models/GameData.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_farm_jwt_secret_2024_secure';
const onlineUsers = new Map(); // socketId -> { userId, username }
const tradeRequests = new Map(); // tradeId -> { from, to, offer, request, status }

export function setupSocket(io) {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) return next(new Error('认证失败'));
            const decoded = jwt.verify(token, JWT_SECRET);
            const user = await User.findById(decoded.id);
            if (!user) return next(new Error('用户不存在'));
            socket.user = { id: user._id.toString(), username: user.username, role: user.role };
            next();
        } catch { next(new Error('认证失败')); }
    });

    io.on('connection', async (socket) => {
        const { id, username } = socket.user;
        onlineUsers.set(socket.id, { userId: id, username });
        await User.findByIdAndUpdate(id, { isOnline: true });

        // 广播在线列表
        const getOnlineList = () => Array.from(onlineUsers.values()).map(u => ({ userId: u.userId, username: u.username }));
        const broadcastOnline = () => io.emit('onlinePlayers', getOnlineList());
        broadcastOnline();

        // 客户端主动请求在线列表
        socket.on('getOnlinePlayers', () => {
            socket.emit('onlinePlayers', getOnlineList());
        });

        // 发送历史消息
        const history = await Message.find().sort({ createdAt: -1 }).limit(50);
        socket.emit('chatHistory', history.reverse());

        // 系统消息
        const sysMsg = await new Message({ sender: '系统', content: `${username} 加入了农场`, type: 'system' }).save();
        io.emit('chatMessage', sysMsg);

        // 聊天
        socket.on('sendMessage', async (content) => {
            if (!content || content.trim().length === 0) return;
            const msg = await new Message({ sender: username, content: content.trim().slice(0, 500), type: 'chat' }).save();
            io.emit('chatMessage', msg);
        });

        // 交易请求
        socket.on('tradeRequest', async ({ targetUserId, offerResource, offerAmount, requestResource, requestAmount }) => {
            const targetSocket = Array.from(onlineUsers.entries()).find(([, u]) => u.userId === targetUserId);
            if (!targetSocket) return socket.emit('tradeError', '对方不在线');
            const tradeId = `${Date.now()}_${id}`;
            tradeRequests.set(tradeId, { from: id, fromName: username, to: targetUserId, offerResource, offerAmount, requestResource, requestAmount, status: 'pending' });
            io.to(targetSocket[0]).emit('tradeIncoming', { tradeId, fromName: username, offerResource, offerAmount, requestResource, requestAmount });
            socket.emit('tradeSent', { tradeId, message: '交易请求已发送' });
        });

        // 接受交易
        socket.on('tradeAccept', async (tradeId) => {
            const trade = tradeRequests.get(tradeId);
            if (!trade || trade.to !== id || trade.status !== 'pending') return socket.emit('tradeError', '交易无效');
            try {
                const fromGd = await GameData.findOne({ userId: trade.from });
                const toGd = await GameData.findOne({ userId: trade.to });
                if (!fromGd || !toGd) return socket.emit('tradeError', '数据异常');
                if (fromGd.resources[trade.offerResource] < trade.offerAmount) return socket.emit('tradeError', '对方资源不足');
                if (toGd.resources[trade.requestResource] < trade.requestAmount) return socket.emit('tradeError', '你的资源不足');
                fromGd.resources[trade.offerResource] -= trade.offerAmount;
                fromGd.resources[trade.requestResource] += trade.requestAmount;
                toGd.resources[trade.requestResource] -= trade.requestAmount;
                toGd.resources[trade.offerResource] += trade.offerAmount;
                fromGd.stats.totalTrades += 1; toGd.stats.totalTrades += 1;
                await fromGd.save(); await toGd.save();
                trade.status = 'completed';
                const fromSocket = Array.from(onlineUsers.entries()).find(([, u]) => u.userId === trade.from);
                if (fromSocket) io.to(fromSocket[0]).emit('tradeCompleted', { tradeId, message: `与 ${username} 的交易完成` });
                socket.emit('tradeCompleted', { tradeId, message: `与 ${trade.fromName} 的交易完成` });
                const tradeMsg = await new Message({ sender: '系统', content: `${trade.fromName} 与 ${username} 完成了一笔交易`, type: 'trade' }).save();
                io.emit('chatMessage', tradeMsg);
            } catch { socket.emit('tradeError', '交易处理失败'); }
        });

        // 拒绝交易
        socket.on('tradeReject', (tradeId) => {
            const trade = tradeRequests.get(tradeId);
            if (!trade || trade.to !== id) return;
            trade.status = 'rejected';
            const fromSocket = Array.from(onlineUsers.entries()).find(([, u]) => u.userId === trade.from);
            if (fromSocket) io.to(fromSocket[0]).emit('tradeRejected', { tradeId, message: `${username} 拒绝了交易` });
        });

        // 断开连接
        socket.on('disconnect', async () => {
            onlineUsers.delete(socket.id);
            await User.findByIdAndUpdate(id, { isOnline: false });
            broadcastOnline();
            const leaveMsg = await new Message({ sender: '系统', content: `${username} 离开了农场`, type: 'system' }).save();
            io.emit('chatMessage', leaveMsg);
        });
    });
}
