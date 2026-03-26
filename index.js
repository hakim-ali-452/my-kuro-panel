const express = require('express');
const mongoose = require('mongoose');
const app = express();
app.use(express.urlencoded({ extended: true }));

// Yahan apna MongoDB link dubara paste karein
const mongoURI = "mongodb+srv://hakimalikhatri452_db_user:VAH3uroGDj8mXXeD@cluster0.kavslgh.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(mongoURI);

// Database Structure (Keys ke liye)
const KeySchema = new mongoose.Schema({
    key: String,
    duration: String, // Hour, Day, etc.
    devices: Number,
    reseller: String,
    status: { type: String, default: 'Active' }
});
const Key = mongoose.model('Key', KeySchema);

// Simple Dashboard HTML
app.get('/', (req, res) => {
    res.send(`
        <html><body style="font-family: sans-serif; text-align: center; background: #121212; color: white;">
            <h1>💎 KURO ADMIN PANEL 💎</h1>
            <div style="background: #1e1e1e; padding: 20px; border-radius: 10px; display: inline-block;">
                <h3>Generate New Key</h3>
                <form action="/generate" method="POST">
                    <input name="time" placeholder="Duration (e.g. 1 Day)" required><br><br>
                    <input name="dev" type="number" placeholder="Device Limit" required><br><br>
                    <button type="submit" style="background: #00ff00; padding: 10px 20px;">Generate Key</button>
                </form>
            </div>
            <br><br>
            <a href="/keys" style="color: cyan;">View All Keys</a>
        </body></html>
    `);
});

// Key Banane ka logic
app.post('/generate', async (req, res) => {
    const newKey = new Key({
        key: "KURO-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        duration: req.body.time,
        devices: req.body.dev,
        reseller: "Admin"
    });
    await newKey.save();
    res.send(`<h3>Key Generated: ${newKey.key}</h3><a href="/">Back</a>`);
});

// Bani hui keys dekhne ke liye
app.get('/keys', async (req, res) => {
    const allKeys = await Key.find();
    res.json(allKeys);
});

app.listen(3000, () => console.log("Panel ready!"));
