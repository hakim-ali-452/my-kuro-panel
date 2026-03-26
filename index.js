const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- VERCEL SERVERLESS DB CONNECTION (Fix for 500 Error) ---
const mongoURI = "mongodb+srv://hakimalikhatri452_db_user:VAH3uroGDj8mXXeD@cluster0.kavslgh.mongodb.net/kuroDB?retryWrites=true&w=majority";
let isConnected = false;

const connectDB = async () => {
    if (isConnected) return;
    try {
        await mongoose.connect(mongoURI);
        isConnected = true;
    } catch (err) {
        console.log("DB Error:", err);
    }
};

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({ username: String, password: String, role: String, points: { type: Number, default: 0 } }));
const Key = mongoose.model('Key', new mongoose.Schema({ key: String, duration: String, devices: Number, reseller: String, date: { type: Date, default: Date.now } }));

// --- SAFE COOKIE READER ---
const getCookies = (req) => {
    const cookies = {};
    if (req.headers.cookie) {
        req.headers.cookie.split(';').forEach(c => {
            const parts = c.split('=');
            if (parts.length >= 2) cookies[parts[0].trim()] = parts[1].trim();
        });
    }
    return cookies;
};

// --- ROUTES ---
app.get('/', async (req, res) => {
    const cookies = getCookies(req);
    if (cookies.admin === 'true') return res.redirect('/admin');
    if (cookies.reseller) return res.redirect('/reseller');
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.send(`
        <body style="background:#000; color:#0f0; text-align:center; padding-top:100px; font-family:sans-serif;">
            <h2 style="text-shadow:0 0 10px #0f0;">🔐 KURO PANEL LOGIN</h2>
            <form action="/login" method="POST" style="background:#111; padding:30px; display:inline-block; border-radius:15px; border:1px solid #0f0;">
                <input name="user" placeholder="Username" style="padding:12px; margin-bottom:10px;" required><br>
                <input name="pass" type="password" placeholder="Password" style="padding:12px; margin-bottom:10px;" required><br>
                <button type="submit" style="background:#0f0; color:#000; padding:12px 30px; border:none; font-weight:bold; cursor:pointer; border-radius:5px;">LOGIN</button>
            </form>
        </body>
    `);
});

app.post('/login', async (req, res) => {
    await connectDB(); // Database yahan connect hoga
    const user = req.body.user;
    const pass = req.body.pass;

    if (user === "admin" && pass === "kuro123") {
        res.setHeader('Set-Cookie', 'admin=true; Path=/; Max-Age=86400');
        return res.redirect('/admin');
    }
    
    try {
        const reseller = await User.findOne({ username: user, password: pass });
        if (reseller) {
            res.setHeader('Set-Cookie', \`reseller=\${reseller.username}; Path=/; Max-Age=86400\`);
            return res.redirect('/reseller');
        }
    } catch (e) { console.log(e); }
    
    res.send("<body style='background:#000; color:red; text-align:center; padding-top:100px;'><h1>Invalid Details!</h1><br><a href='/login' style='color:#0f0;'>Try Again</a></body>");
});

app.get('/admin', async (req, res) => {
    await connectDB();
    const cookies = getCookies(req);
    if (cookies.admin !== 'true') return res.redirect('/login');
    
    const resellers = await User.find({ role: 'reseller' });
    res.send(`
        <body style="background:#000; color:#fff; font-family:sans-serif; text-align:center;">
            <h1 style="color:#0f0;">💎 ADMIN DASHBOARD</h1>
            <form action="/add-reseller" method="POST" style="background:#111; padding:20px; border:1px solid #333;">
                <input name="u" placeholder="User" required> <input name="p" placeholder="Pass" required> <input name="pts" type="number" placeholder="Points" required>
                <button type="submit" style="background:#0f0; padding:5px 15px; border:none; font-weight:bold; cursor:pointer;">ADD</button>
            </form>
            <br><h3>Resellers:</h3>
            ${resellers.map(r => `<p style="color:#0f0;">${r.username} - Pts: ${r.points}</p>`).join('')}
            <br><a href="/logout" style="color:red;">Logout</a>
        </body>
    `);
});

app.get('/reseller', async (req, res) => {
    await connectDB();
    const cookies = getCookies(req);
    if (!cookies.reseller) return res.redirect('/login');
    
    const data = await User.findOne({ username: cookies.reseller });
    if (!data) return res.redirect('/logout');
    
    res.send(`
        <body style="background:#000; color:#fff; font-family:sans-serif; text-align:center;">
            <h2 style="color:#0f0;">Reseller: ${data.username} | Points: ${data.points}</h2>
            <form action="/gen-key" method="POST" style="background:#111; padding:30px; display:inline-block; border:1px solid #0f0;">
                <select name="type" style="padding:10px;"><option>Minutes</option><option>Hours</option><option>Days</option></select>
                <input name="time" type="number" placeholder="Value" style="padding:10px;" required>
                <input name="dev" type="number" placeholder="Devices" style="padding:10px;" required><br><br>
                <button type="submit" style="background:#0f0; padding:10px; font-weight:bold; cursor:pointer;">GENERATE (-1 PT)</button>
            </form>
            <br><a href="/logout" style="color:red;">Logout</a>
        </body>
    `);
});

app.post('/add-reseller', async (req, res) => {
    await connectDB();
    const cookies = getCookies(req);
    if (cookies.admin !== 'true') return res.redirect('/login');
    await new User({ username: req.body.u, password: req.body.p, points: req.body.pts, role: 'reseller' }).save();
    res.redirect('/admin');
});

app.post('/gen-key', async (req, res) => {
    await connectDB();
    const cookies = getCookies(req);
    if (!cookies.reseller) return res.redirect('/login');
    
    const user = await User.findOne({ username: cookies.reseller });
    if (!user || user.points < 1) return res.send("No Points!");
    
    const k = new Key({ key: "KURO-" + Math.random().toString(36).substring(7).toUpperCase(), duration: req.body.time + " " + req.body.type, devices: req.body.dev, reseller: user.username });
    await k.save();
    await User.updateOne({ username: user.username }, { $inc: { points: -1 } });
    res.send(\`<body style="background:#000; color:#0f0; text-align:center; padding:50px;"><h1>KEY: \${k.key}</h1><br><a href='/reseller' style="color:white;">Back</a></body>\`);
});

app.get('/logout', (req, res) => { 
    res.setHeader('Set-Cookie', ['admin=; Max-Age=0; Path=/', 'reseller=; Max-Age=0; Path=/']);
    res.redirect('/login'); 
});

module.exports = app;
