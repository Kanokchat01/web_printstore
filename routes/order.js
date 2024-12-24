const express = require('express');
const router = express.Router();
const db = require('../db'); // Database connection
const multer = require('multer');
const path = require('path');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads')); // Save to 'uploads' in the root directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique filename
    }
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

// Handle POST request with file upload
router.post('/', upload.single('uploaded_file'), (req, res) => {
    if (req.session.loggedIn) {
        console.log(req.file);
        const { paperSize, quantity, total, type } = req.body;
        const filePath = req.file ? req.file.path : null; // Get file path from multer  
        
        const sql = `INSERT INTO order_detail (size_page, num_page, price_sum, file_path, ID_Cus, status, type_page) VALUES (?, ?, ?, ?, ?, 'pending',?)`;


        db.query(sql, [paperSize, quantity, total, filePath, req.session.userID,type], (err,result) => {
            if (err) throw err;
            // Get the inserted order ID to use in the payment page
            const orderId = result.insertId;

            // Redirect to payment page with the order ID as a query parameter
            res.redirect(`/payment?orderId=${orderId}`);
        });
    } else {
        res.redirect('/login');
    }
});

module.exports = router;
