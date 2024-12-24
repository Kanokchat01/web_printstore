const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer'); // เพิ่ม multer สำหรับอัปโหลดไฟล์
const path = require('path'); // โมดูลสำหรับจัดการ path
const app = express();

// ตั้งค่าการเชื่อมต่อกับฐานข้อมูล
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'Shopprint'
});

db.connect((err) => {
    if (err) throw err;
    console.log('Connected to database');
});

// ตั้งค่า storage สำหรับ multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // กำหนดโฟลเดอร์ที่เก็บไฟล์
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // กำหนดชื่อไฟล์ด้วย timestamp
    }
});

// กำหนดการอัปโหลดไฟล์
const upload = multer({ storage: storage });

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// ตั้งค่าให้ Express ใช้งาน session
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// ตั้งค่า EJS
app.set('view engine', 'ejs');

// Middleware สำหรับส่ง session ไปยังทุกหน้า
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// แสดงหน้า register
app.get('/register', (req, res) => {
    res.render('register');
});

// จัดการ POST request จากฟอร์ม register
app.post('/register', (req, res) => {
    const { username, address, phone, password } = req.body;
    const sql = `INSERT INTO accounts (Username, password, type) VALUES (?, ?, 'user')`;

    db.query(sql, [username, password], (err, result) => {
        if (err) throw err;
        console.log('User registered');
        res.redirect('/login'); // เปลี่ยนเส้นทางไปยังหน้า login
    });
});

// เส้นทางสำหรับหน้าแรก
app.get('/', (req, res) => {
    res.render('index'); // แสดงหน้า index.ejs
});

// เส้นทางสำหรับหน้า login
app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/admin', (req, res) => {
    res.render('adminForm');
});

// จัดการ POST request จากฟอร์ม login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = `SELECT * FROM accounts WHERE Username = ? AND password = ?`;

    db.query(sql, [username, password], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            const userID = result[0].ID_ac; // บันทึก ID ของลูกค้า

            // บันทึกการ login ลงในตาราง logaccounts
            const logSql = `INSERT INTO logaccounts (date, ID_ac) VALUES (NOW(), ?)`;
            db.query(logSql, [userID], (logErr, logResult) => {
                if (logErr) throw logErr;
                console.log('Login logged successfully');
            });

            // ตั้งค่าข้อมูล session หลังการ login สำเร็จ
            req.session.loggedIn = true;
            req.session.userID = result[0].ID_Cus; // บันทึก ID ของลูกค้า
            res.redirect('/index');
        } else {
            res.send('Invalid username or password');
        }
    });
});

// แสดงหน้า Index (ต้อง Login ก่อน)
app.get('/index', (req, res) => {
    if (req.session.loggedIn) {
        res.render('index'); // แสดงหน้า index หาก login แล้ว
    } else {
        res.redirect('/login'); // หากยังไม่ได้ login ให้ redirect ไปหน้า login
    }
});

// จัดการ POST request จากการสั่งพิมพ์ พร้อมการอัปโหลดไฟล์
app.post('/order', upload.single('file'), (req, res) => {
    if (req.session.loggedIn) {
        const { paperSize, quantity, total, type } = req.body;
        const file = req.file; // ข้อมูลไฟล์ที่อัปโหลด

        if (!file) {
            return res.status(400).send('No file uploaded.');
        }

        const sql = `INSERT INTO order_detail (size_page, num_page, price_sum, file_path, file_name) VALUES (?, ?, ?, ?, ?)`;
        db.query(sql, [paperSize, quantity, total, file.path, file.filename], (err, result) => {
            if (err) throw err;
            res.redirect('/');
        });
    } else {
        res.redirect('/login');
    }
});

// จัดการ logout
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect('/login');
    });
});

// เริ่มเซิร์ฟเวอร์
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
