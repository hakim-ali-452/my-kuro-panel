const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.urlencoded({ extended: true }));

// Sahi Connection String
const mongoURI = "mongodb+srv://hakimalikhatri452_db_user:VAH3uroGDj8mXXeD@cluster0.kavslgh.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("DB Connected!"))
    .catch(err => console.log("DB Error: ", err));

const Key = mongoose.model('Key', new mongoose.Schema({
    key: String, duration: String, devices: Number, reseller: String
}));

app.get('/', (req, res) => {
    res.send('<h1>Kuro Panel is Live!</h1><form action="/gen" method="POST"><input name="t" placeholder="Time"><input name="d" type="number" placeholder="Devices"><button>Generate</button></form><br><a href="/all">View Keys</a>');
});

app.post('/gen', async (req, res) => {
    const k = new Key({ key: "KURO-" + Math.random().toString(36).substring(7).toUpperCase(), duration: req.body.t, devices: req.body.d, reseller: "Admin" });
    await k.save();
    res.send("Generated: " + k.key + " <a href='/'>Back</a>");
});

app.get('/all', async (req, res) => {
    const keys = await Key.find();
    res.json(keys);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Ready on " + PORT));
