const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const app = express();

// ตั้งค่าการเชื่อมต่อกับฐานข้อมูล
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'Shopprint'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        throw err;
    } 
    console.log('Connected to database');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(express.static('uploads'));

// เพิ่มการตั้งค่า session
app.use(session({
    secret: 'secret-key',  // ใส่ secret key ของคุณเอง
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // สำหรับการพัฒนา local ต้องตั้งค่าเป็น false
}));

// ตั้งค่า EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware สำหรับส่ง session ไปยังทุกหน้า
app.use((req, res, next) => {
    res.locals.session = req.session; // ส่ง session ไปยังทุกหน้า
    next();
});

// เรียกใช้ routes ที่แยกออกมา
app.use('/', require('./routes/index'));
app.use('/login', require('./routes/login'));
app.use('/register', require('./routes/register'));
app.use('/order', require('./routes/order'));
app.use('/payment', require('./routes/payment'));
app.use('/receipt', require('./routes/receipt'));

// เชื่อมต่อเส้นทาง admin
const adminRoutes = require('./routes/admin');
app.use('/admins_auth', adminRoutes);

// ตั้งค่าเส้นทางสำหรับการแสดงไฟล์ที่อัปโหลด
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// เริ่มเซิร์ฟเวอร์
app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
});
