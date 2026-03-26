// Basic Kuro Panel Code by Gemini
const express = require('express');
const mongoose = require('mongoose');
const app = express();

// Aapka MongoDB Link yahan aayega (Jo humne pehle copy kiya tha)
const mongoURI = "mongodb+srv://hakimalikhatri452_db_user:VAH3uroGDj8mXXeD@clusterB.kavsigh.mongodb.net

/?appName Clustere";

mongoose.connect(mongoURI).then(() => console.log("Database Connected!"));

app.get('/', (req, res) => {
    res.send("Kuro Panel is Running Live!");
});

// Key Generate karne ka route
app.get('/gen', (req, res) => {
    const { time, device, reseller } = req.query;
    // Yahan key banane ka logic hoga
    res.json({ status: "Success", key: "KURO-" + Math.random().toString(36).substring(7), duration: time, devices: device });
});

app.listen(3000, () => console.log("Server started on port 3000"));
