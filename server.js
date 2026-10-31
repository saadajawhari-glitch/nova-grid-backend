const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

const PORT = 3000;

// عدادات كافة الغرف للساحات الثلاث (100، 500، 1000)
const rooms = {
    // ساحة الـ 100
    'express-100': 0, 'silver-100': 0, 'diamond-100': 0,
    // ساحة الـ 500
    'express-500': 0, 'silver-500': 0, 'diamond-500': 0,
    // ساحة الـ 1000
    'express-1000': 0, 'silver-1000': 0, 'diamond-1000': 0
};

io.on('connection', (socket) => {
    console.log(`👤 مستخدم متصل جديد: ${socket.id}`);

    socket.on('join_room', (roomName) => {
        socket.join(roomName);
        socket.emit('room_update', { roomName, clicks: rooms[roomName] || 0 });
    });

    socket.on('make_click', ({ roomName, clickCost }) => {
        if (rooms[roomName] !== undefined) {
            rooms[roomName] += clickCost;
            
            // تحديد الحد الأقصى بناءً على اسم الغرفة
            let targetLimit = 100;
            if (roomName.includes('-500')) targetLimit = 500;
            if (roomName.includes('-1000')) targetLimit = 1000;

            if (rooms[roomName] >= targetLimit) {
                rooms[roomName] = targetLimit;
                io.to(roomName).emit('room_update', { roomName, clicks: targetLimit });
                
                setTimeout(() => {
                    io.to(roomName).emit('room_won', { 
                        roomName, 
                        message: `🏆 BOOM! مبروك للفائز في غرفة ${roomName.toUpperCase()}! لقد أكمل العداد ${targetLimit}/${targetLimit} بنجاح!` 
                    });
                    rooms[roomName] = 0;
                    io.to(roomName).emit('room_update', { roomName, clicks: 0 });
                }, 300);
            } else {
                io.to(roomName).emit('room_update', { roomName, clicks: rooms[roomName] });
            }
        }
    });

    socket.on('disconnect', () => {
        console.log(`❌ خرج المستخدم: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`🚀 السيرفر يعمل بنجاح على البورت ${PORT}`);
});