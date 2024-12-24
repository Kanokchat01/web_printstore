const express = require('express');
const router = express.Router();
const db = require('../db');
const path = require('path');
const fs = require('fs');
const { createCanvas } = require('canvas');


// Function to create a receipt image with detailed order information
async function createReceiptImage(orderId, orderDetails) {
    const width = 800;  // Increase width to fit the table horizontally
    const height = 400;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Set background color to white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Set text styles
    ctx.fillStyle = '#000000';
    ctx.font = '20px Arial';
    
    // Receipt header (company/store details)
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Ruk-Print', 320, 50);  // Centered text
    ctx.font = '16px Arial';
    ctx.fillText('123 Main St, Bangkok, Thailand', 270, 80);
    ctx.fillText('Tel: +66 1234 5678', 340, 100);
    
    // Divider line
    ctx.beginPath();
    ctx.moveTo(20, 110);
    ctx.lineTo(780, 110);  // Extended the divider to cover wider width
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    // Order ID and Date
    ctx.font = '16px Arial';
    ctx.fillText(`Order ID: ${orderId}`, 50, 140);
    const orderDate = new Date().toLocaleDateString();
    ctx.fillText(`Date: ${orderDate}`, 650, 140);

    // Divider line
    ctx.beginPath();
    ctx.moveTo(20, 160);
    ctx.lineTo(780, 160);
    ctx.stroke();

    // Table Header (Horizontal Format)
    ctx.font = 'bold 16px Arial';
    ctx.fillText('Page Size', 50, 190);
    ctx.fillText('Page Type', 200, 190);
    ctx.fillText('Quantity', 350, 190);
    // ctx.fillText('Price Per Page', 500, 190);
    ctx.fillText('Total Price', 650, 190);

    // Divider line for table header
    ctx.beginPath();
    ctx.moveTo(20, 210);
    ctx.lineTo(780, 210);
    ctx.stroke();

    // Table Row (Product Information)
    ctx.font = '16px Arial';
    const itemType = orderDetails.type_page || 'N/A';
    const itemSize = orderDetails.size_page || 'N/A';
    const itemQuantity = orderDetails.num_page || 0;
    const itemPrice = orderDetails.price_page !== null ? `${orderDetails.price_page} THB` : 'Free';
    const totalPrice = orderDetails.price_sum !== null ? `${orderDetails.price_sum} THB` : 'Free';

    // Display the product details in a horizontal table format
    let yPosition = 240;  // y-position for table row
    ctx.fillText(`${itemSize}`, 50, yPosition);  // Page Size
    ctx.fillText(`${itemType}`, 200, yPosition);  // Page Type
    ctx.fillText(`${itemQuantity}`, 350, yPosition);  // Quantity
    // ctx.fillText(`${itemPrice}`, 500, yPosition);  // Price per page
    ctx.fillText(`${totalPrice}`, 650, yPosition);  // Total Price

    // Divider line after table row
    yPosition += 30;
    ctx.beginPath();
    ctx.moveTo(20, yPosition);
    ctx.lineTo(780, yPosition);
    ctx.stroke();

    // Thank you message
    yPosition += 40;
    ctx.font = 'italic 18px Arial';
    ctx.fillText('Thank you for your purchase!', 320, yPosition);

    // Save the image to a file
    const filePath = path.join(__dirname, '../uploads/receipts', `receipt-${orderId}.png`);
    const out = fs.createWriteStream(filePath);
    const stream = canvas.createPNGStream();
    stream.pipe(out);

    return new Promise((resolve, reject) => {
        out.on('finish', () => resolve(filePath));
        out.on('error', reject);
    });
}



// Route to generate the receipt image or update an existing one
router.get('/create-receipt', async (req, res) => {
    const orderId = req.query.orderId;

    // Fetch the order details from the database using the order ID
    const sql = `SELECT * FROM order_detail WHERE ID_detail = ?`;
    db.query(sql, [orderId], async (err, results) => {
        if (err) throw err;

        const order = results[0];
        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Check if the receipt already exists
        if (order.receipt_path) {
            const existingReceiptPath = path.join(__dirname, '../uploads/receipts', `receipt-${orderId}.png`);
            
            if (fs.existsSync(existingReceiptPath)) {
                // Return only the relative path (starting from /uploads/...)
                const relativePath = `/uploads/receipts/receipt-${orderId}.png`;
                return res.json({
                    message: 'Receipt already exists',
                    receiptPath: relativePath
                });
            }
        }

        try {
            // Create receipt image if it does not exist
            const receiptPath = await createReceiptImage(orderId, order);

            // Keep only the relative path for the receipt
            const relativeReceiptPath = receiptPath.replace(path.join(__dirname, '../'), '');

            // Update the database with the relative receipt path if it wasn't already set
            const updateSql = `UPDATE order_detail SET receipt_path = ? WHERE ID_detail = ?`;
            db.query(updateSql, [relativeReceiptPath, orderId], (updateErr) => {
                if (updateErr) throw updateErr;

                // Redirect to display the receipt
                res.redirect(`/receipt?orderId=${orderId}`);
            });
        } catch (error) {
            console.error('Error creating receipt image:', error);
            res.status(500).send('Error creating receipt image');
        }
    });
});


// Handle GET request for showing the receipt
router.get('/', (req, res) => {
    const orderId = req.query.orderId;

    // Fetch the order details including the receipt path from the database using the order ID
    const sql = `SELECT * FROM order_detail WHERE ID_detail = ?`;
    db.query(sql, [orderId], (err, results) => {
        if (err) throw err;

        // Check if the order exists and if there is a receipt
        const order = results[0];
        if (!order) {
            return res.status(404).send('Order not found');
        }

        if (!order.receipt_path) {
            return res.status(404).send('Receipt not uploaded');
        }

        // Pass the receipt details to the EJS view for rendering
        res.render('receipt', {
            order: order,         // Pass the order details
            receiptPath: order.receipt_path  // Pass the receipt path
        });
    });
});

module.exports = router;
