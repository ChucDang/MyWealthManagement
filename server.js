const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware để phục vụ file tĩnh (index.html, css, js) từ thư mục hiện tại
app.use(express.static(__dirname));

// Cấu hình CORS đơn giản (cho phép mọi nguồn, có thể hạn chế sau)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Lấy thông tin kết nối database từ biến môi trường (Render sẽ cung cấp)
// Hoặc dùng giá trị mặc định cho local development
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'referrer_db',
    port: process.env.DB_PORT || 3306
};

const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

// Kiểm tra kết nối database
app.get('/api/health', async (req, res) => {
    try {
        await promisePool.query('SELECT 1');
        res.json({ status: 'OK', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'ERROR', message: err.message });
    }
});

// API lấy danh sách referrers
app.get('/api/referrers', async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            'SELECT Name, JoinDate, Rate, Phone, Note, Zalo, RelatedPic FROM Referrer ORDER BY JoinDate DESC'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error('Database error:', err);
        res.status(500).json({ success: false, message: 'Lỗi truy vấn dữ liệu' });
    }
});

// Route mặc định trả về index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
    console.log(`API: http://localhost:${PORT}/api/referrers`);
});
