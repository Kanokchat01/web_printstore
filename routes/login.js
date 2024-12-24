const express = require('express');
const router = express.Router();
const db = require('../db'); // การเชื่อมต่อฐานข้อมูล

// แสดงหน้า login
router.get('/', (req, res) => {
    res.render('login');
});

// จัดการ POST request จากฟอร์ม login
router.post('/', (req, res) => {
    const { username, password } = req.body;
    const sql = `SELECT * FROM accounts WHERE Username = ? AND password = ?`;

    db.query(sql, [username, password], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            const userID = result[0].ID_ac; // บันทึก ID ของลูกค้า
            const type = result[0].type; // บันทึกประเภทของผู้ใช้ (admin/user)
            
            // บันทึกการ login ลงในตาราง logaccounts
            const logSql = `INSERT INTO logaccounts (date, ID_ac) VALUES (NOW(), ?)`;
            db.query(logSql, [userID], (logErr) => {
                if (logErr) throw logErr;
                console.log('Login logged successfully');
            });

            // ตั้งค่าข้อมูล session หลังการ login สำเร็จ
            req.session.loggedIn = true;
            req.session.userID = userID;
            req.session.type = type; // บันทึกประเภทของผู้ใช้

            // ตรวจสอบสิทธิ์ของผู้ใช้และกำหนดเส้นทาง
            if (type === 'admin') {
                res.redirect('/admins_auth/adminsForm'); // เส้นทางสำหรับ admin
            } else {
                res.redirect('/'); // เส้นทางสำหรับ user ทั่วไป
            }
        } else {
            res.send('Invalid username or password');
        }
    });
});

module.exports = router;
