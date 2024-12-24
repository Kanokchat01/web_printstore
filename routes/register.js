const express = require('express');
const router = express.Router();
const db = require('../db'); // การเชื่อมต่อฐานข้อมูล

// แสดงหน้า register
router.get('/', (req, res) => {
    res.render('register');
});

// จัดการ POST request จากฟอร์ม register
router.post('/', (req, res) => {
    const { username, address, phone, password } = req.body;

    // บันทึกข้อมูลลงในตาราง accounts
    const sqlInsertAccount = `INSERT INTO accounts (Username, password, type) VALUES (?, ?, 'user')`;

    db.query(sqlInsertAccount, [username, password], (err, result) => {
        if (err) throw err;

        // ดึง ID ของ accounts ที่เพิ่งถูก insert
        const accountId = result.insertId;

        // บันทึกข้อมูลลงในตาราง customersuser
        const sqlInsertCustomer = `INSERT INTO customersuser (ID_Cus, Address_Cus, tel_Cus) VALUES (?, ?, ?)`;

        db.query(sqlInsertCustomer, [accountId, address, phone], (err2) => {
            if (err2) throw err2;
            console.log('User registered and customer info saved');
            res.redirect('/login'); // เปลี่ยนเส้นทางไปยังหน้า login
        });
    });
});

module.exports = router;
