const express = require('express');
const router = express.Router();

// เส้นทางสำหรับหน้าแรก (ต้อง Login ก่อน)
router.get('/', (req, res) => {
    res.render('index'); // แสดงหน้า index หาก login แล้ว
   
});

// เส้นทางสำหรับ logout
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect('/login');
    });
});

// เส้นทางสำหรับหน้า adminForm
router.get('/adminForm', (req, res) => {
    console.log("Accessing /admins_auth/adminsForm"); // เพิ่มการตรวจสอบ
    res.render('adminForm'); 
});

router.get('/updateForm', (req, res) => {
    console.log("Accessing /updateForm"); // เพิ่มการตรวจสอบup
    res.render('updateForm'); 
});

module.exports = router;
