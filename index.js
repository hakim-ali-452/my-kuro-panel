const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.urlencoded({ extended: true }));

// Aapka Sahi MongoDB Link
const mongoURI = "mongodb+srv://hakimalikhatri452_db_user:VAH3uroGDj8mXXeD@cluster0.kavslgh.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("DB Connected Successfully!"))
    .catch(err => console.log("DB Connection Error: ", err));

// Database Model
const Key = mongoose.model('Key', new mongoose.Schema({
    key: String,
    duration: String,
    devices: Number,
    reseller: String,
    date: { type: Date, default: Date.now }
}));

// Home Page Dashboard
app.get('/', (req, res) => {
    res.send(`
        <html><body style="font-family: sans-serif; text-align: center; background: #000; color: #0f0; padding: 50px;">
            <h1 style="text-shadow: 0 0 10px #0f0;">💎 KURO ADMIN PANEL 💎</h1>
            <div style="border: 2px solid #0f0; padding: 20px; display: inline-block; border-radius: 15px;">
                <h3>GENERATE NEW KEY</h3>
                <form action="/generate" method="POST">
                    <input name="time" placeholder="Time (e.g. 1 Hour)" style="padding: 10px;" required><br><br>
                    <input name="dev" type="number" placeholder="Device Limit" style="padding: 10px;" required><br><br>
                    <button type="submit" style="background: #0f0; color: #000; padding: 10px 30px; border: none; font-weight: bold; cursor: pointer;">GENERATE</button>
                </form>
            </div>
            <br><br>
            <a href="/keys" style="color: #0f0; text-decoration: none;">[ VIEW ALL KEYS ]</a>
        </body></html>
    `);
});

// Generate Key Logic
app.post('/generate', async (req, res) => {
    try {
        const newKey = new Key({
            key: "KURO-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
            duration: req.body.time,
            devices: req.body.dev,
            reseller: "Admin"
        });
        await newKey.save();
        res.send(\`
            <body style="background:#000; color:#0f0; text-align:center; padding:50px;">
                <h2>KEY GENERATED SUCCESSFULLY!</h2>
                <h1 style="background:#0f0; color:#000; display:inline-block; padding:10px;">\${newKey.key}</h1>
                <br><br><a href="/" style="color:#fff;">Back to Dashboard</a>
            </body>
        \`);
    } catch (e) { res.send("Error: " + e.message); }
});

// View Keys
app.get('/keys', async (req, res) => {
    const allKeys = await Key.find();
    res.json(allKeys);
});

// Render Port Fix
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Panel is Live on Port " + PORT));
