const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());  // để đọc dữ liệu JSON từ client
app.use(express.static(__dirname));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Cấu hình database (dùng biến môi trường trên Render)
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'referrer_db',
    port: process.env.DB_PORT || 3306
};

const pool = mysql.createPool(dbConfig);
const promisePool = pool.promise();

// Kiểm tra sức khỏe
app.get('/api/health', async (req, res) => {
    try {
        await promisePool.query('SELECT 1');
        res.json({ status: 'OK', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'ERROR', message: err.message });
    }
});

// Lấy danh sách referrer
app.get('/api/referrers', async (req, res) => {
    try {
        const [rows] = await promisePool.query(
            'SELECT Name, JoinDate, Rate, Phone, Note, Zalo, RelatedPic FROM Referrer ORDER BY JoinDate DESC'
        );
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi truy vấn dữ liệu' });
    }
});

// Thêm mới referrer
app.post('/api/referrers', async (req, res) => {
    try {
        const { Name, JoinDate, Rate, Phone, Note, Zalo, RelatedPic } = req.body;

        // Validation cơ bản
        if (!Name || Name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Tên không được để trống' });
        }
        if (Name.length > 25) {
            return res.status(400).json({ success: false, message: 'Tên không được vượt quá 25 ký tự' });
        }
        if (Note && Note.length > 125) {
            return res.status(400).json({ success: false, message: 'Ghi chú không được vượt quá 125 ký tự' });
        }
        let rateValue = 0;
        if (Rate !== undefined && Rate !== '') {
            rateValue = parseFloat(Rate);
            if (isNaN(rateValue)) {
                return res.status(400).json({ success: false, message: 'Hoa hồng phải là số' });
            }
        }

        // Chuyển đổi JoinDate từ dd/mm/yyyy sang yyyy-mm-dd
        let formattedDate = null;
        if (JoinDate && JoinDate.trim() !== '') {
            const parts = JoinDate.split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                formattedDate = `${year}-${month.padStart(2,'0')}-${day.padStart(2,'0')}`;
            } else {
                return res.status(400).json({ success: false, message: 'Sai định dạng ngày (dd/mm/yyyy)' });
            }
        }

        const sql = `INSERT INTO Referrer 
                     (Name, JoinDate, Rate, Phone, Note, Zalo, RelatedPic) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            Name.trim(),
            formattedDate,
            rateValue,
            Phone?.trim() || null,
            Note?.trim() || null,
            Zalo?.trim() || null,
            RelatedPic?.trim() || null
        ];

        await promisePool.query(sql, values);
        res.json({ success: true, message: 'Thêm Referrer thành công' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + err.message });
    }
});

// Phục vụ file index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
