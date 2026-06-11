const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Cấu hình CORS để frontend có thể gọi
app.use(cors());
app.use(express.json());

// Tạo kết nối đến MySQL (thay đổi thông tin cho đúng)
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',          // tên đăng nhập MySQL của bạn
    password: '',          // mật khẩu (nếu có)
    database: 'amberoil' // tên database chứa bảng Referrer
});

db.connect((err) => {
    if (err) {
        console.error('Lỗi kết nối MySQL:', err.message);
        process.exit(1);
    }
    console.log('✅ Đã kết nối MySQL thành công');
});

// API lấy danh sách referrer
app.get('/api/referrers', (req, res) => {
    const sql = 'SELECT Name, JoinDate, Rate, Phone, Note, Zalo, RelatedPic FROM Referrer ORDER BY JoinDate DESC';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Lỗi truy vấn:', err);
            return res.status(500).json({ success: false, message: 'Lỗi truy vấn database' });
        }
        res.json({ success: true, data: results });
    });
});

// Khởi động server
app.listen(PORT, () => {
    console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
    console.log(`👉 API danh sách referrer: http://localhost:${PORT}/api/referrers`);
});