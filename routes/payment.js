const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Handle GET request for payment page
router.get('/', (req, res) => {
    const orderId = req.query.orderId;

    // Fetch the order details from the database using the order ID
    const sql = `SELECT * FROM order_detail WHERE ID_detail = ?`;
    db.query(sql, [orderId], (err, results) => {
        if (err) throw err;

        // Simulate generating a QR code (you can use a QR code generation library here)
        const qrCode = `https://rebeltoolkit.extinctionrebellion.uk/uploads/images/gallery/2021-07/MakeAQRCodeShort.png`;

        // Pass the order details and QR code to the EJS view for rendering
        res.render('payment', {
            order: results[0], // Pass the order details
            qrCode: qrCode     // Pass the QR code link
        });
    });
});

// Multer storage configuration for saving the payment slip
const slipStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../uploads/slips')); // Store payment slips in 'uploads/slips' directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // Unique filename for the slip
    }
});

// Initialize multer for payment slip uploads
const uploadSlip = multer({ storage: slipStorage });

// Handle the POST request for payment slip upload
router.post('/upload-slip/:orderId', uploadSlip.single('payment_slip'), (req, res) => {
    const orderId = req.params.orderId;
    const slipPath = req.file ? req.file.path : null; // Get the uploaded file path

    if (!slipPath) {
        return res.status(400).send('No file uploaded');
    }

    // Update the order_detail with the payment slip path and set the status to 'paid'
    const sql = `UPDATE order_detail SET payment_slip = ?, status = 'paid' WHERE ID_detail = ?`;

    db.query(sql, [slipPath, orderId], (err) => {
        if (err) throw err;
        res.redirect(`/receipt/create-receipt/?orderId=${orderId}`); // Redirect back to the payment page or success page
    });
});


module.exports = router;
