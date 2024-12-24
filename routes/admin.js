const express = require('express');
const router = express.Router();
const db = require('../db'); // การเชื่อมต่อฐานข้อมูล

// ดึงข้อมูลในตาราง order_detail มาแสดงในหน้า adminForm
router.get('/adminsForm', function(req, res, next) {
    var sql = 'SELECT * FROM order_detail'; // คำสั่ง SQL
    db.query(sql, (err, result) => {
        if (err) {
            console.log("Error executing SQL query: ", err); // Debug ข้อผิดพลาดเมื่อรันคำสั่ง SQL
            res.send(err);
        } else {
            console.log("SQL query executed successfully, result: ", result); // Debug ผลลัพธ์จาก SQL
            res.render('admins_auth/adminsForm', { items: result }); // ส่งข้อมูลไปยังหน้า adminForm
        }
    });
});

// เส้นทางสำหรับแก้ไขข้อมูล (Edit)
router.get('/edit/:ID_detail', (req, res) => {
    const ID_detail = req.params.ID_detail;
    const sql = 'SELECT * FROM order_detail WHERE ID_detail = ?';
    db.query(sql, [ID_detail], (err, result) => {
        if (err) {
            res.send(err);
        } else {
            if (result.length > 0) {
                res.render('updateForm', { item: result[0] });  // ส่งข้อมูลไปยังฟอร์มแก้ไข
            } else {
                res.send('No record found with ID_detail: ' + ID_detail);
            }
        }
    });
});

// เส้นทางสำหรับอัปเดตข้อมูล (POST)
router.post('/edit/:ID_detail', (req, res) => {
    const ID_detail = req.params.ID_detail;
    const updatedData = {
        num_page: req.body.num_page,
        price_sum: req.body.price_sum,
        file_path: req.body.file_path
    };
    const sql = 'UPDATE order_detail SET ? WHERE ID_detail = ?';
    db.query(sql, [updatedData, ID_detail], (err, result) => {
        if (err) {
            res.send(err);
        } else {
            res.redirect('/admins_auth/adminsForm');  // กลับไปที่หน้าแสดงรายการทั้งหมด
        }
    });
});

router.get('/delete/:ID_detail', (req, res) => {
    const ID_detail = req.params.ID_detail;
    const sql = 'DELETE FROM order_detail WHERE ID_detail = ?';
    db.query(sql, [ID_detail], (err, result) => {
        if (err) {
            res.send(err);
        } else {
            res.redirect('/admins_auth/adminsForm');  // กลับไปที่หน้าแสดงรายการทั้งหมดหลังจากลบข้อมูลสำเร็จ
        }
    });
});

module.exports = router;
