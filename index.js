const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: 'kuro_secret_key', 
    resave: false, 
    saveUninitialized: true 
}));

// --- DATABASE CONNECTION ---
const mongoURI = "mongodb+srv://hakimalikhatri452_db_user:VAH3uroGDj8mXXeD@cluster0.kavslgh.mongodb.net/kuroDB?retryWrites=true&w=majority";
mongoose.connect(mongoURI).then(() => console.log("DB Connected")).catch(err => console.log(err));

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    username: String, password: String, role: String, points: { type: Number, default: 0 }
}));
const Key = mongoose.model('Key', new mongoose.Schema({
    key: String, duration: String, devices: Number, reseller: String, createdAt: { type: Date, default: Date.now }
}));

// --- ADMIN SETTINGS ---
const ADMIN_USER = "admin";
const ADMIN_PASS = "kuro123";

// --- ROUTES ---

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.send(`
        <body style="background:#000; color:#0f0; text-align:center; font-family:sans-serif; padding-top:100px;">
            <h1>🔐 KURO PANEL LOGIN</h1>
            <form action="/login" method="POST" style="background:#111; display:inline-block; padding:40px; border-radius:15px; border:1px solid #0f0;">
                <input name="user" placeholder="Username" style="padding:12px; margin-bottom:10px;" required><br>
                <input name="pass" type="password" placeholder="Password" style="padding:12px; margin-bottom:10px;" required><br>
                <button type="submit" style="background:#0f0; color:#000; padding:10px 30px; border:none; cursor:pointer; font-weight:bold;">LOGIN</button>
            </form>
        </body>
    `);
});

app.post('/login', async (req, res) => {
    const { user, pass } = req.body;
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        req.session.admin = true;
        return res.redirect('/admin');
    }
    const reseller = await User.findOne({ username: user, password: pass });
    if (reseller) {
        req.session.reseller = reseller.username;
        return res.redirect('/reseller');
    }
    res.send("Invalid! <a href='/login'>Back</a>");
});

app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const resellers = await User.find({ role: 'reseller' });
    res.send(`
        <body style="background:#000; color:#fff; font-family:sans-serif; text-align:center;">
            <h1 style="color:#0f0;">ADMIN DASHBOARD</h1>
            <form action="/add-reseller" method="POST">
                <input name="u" placeholder="User"> <input name="p" placeholder="Pass"> <input name="pts" type="number" placeholder="Points">
                <button type="submit" style="background:#0f0;">Add Reseller</button>
            </form>
            <br><h3>Resellers:</h3>
            ${resellers.map(r => `<p>${r.username} - Pts: ${r.points}</p>`).join('')}
            <br><a href="/logout" style="color:red;">Logout</a>
        </body>
    `);
});

app.get('/reseller', async (req, res) => {
    if (!req.session.reseller) return res.redirect('/login');
    const data = await User.findOne({ username: req.session.reseller });
    res.send(`
        <body style="background:#000; color:#fff; font-family:sans-serif; text-align:center;">
            <h2>Reseller: ${data.username} | Points: ${data.points}</h2>
            <form action="/gen-key" method="POST">
                <select name="type"><option>Minutes</option><option>Hours</option><option>Days</option></select>
                <input name="time" type="number" placeholder="Value"> <input name="dev" type="number" placeholder="Device">
                <button type="submit" style="background:#0f0;">GENERATE (-1 Point)</button>
            </form>
            <br><a href="/logout" style="color:red;">Logout</a>
        </body>
    `);
});

app.post('/add-reseller', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    await new User({ username: req.body.u, password: req.body.p, points: req.body.pts, role: 'reseller' }).save();
    res.redirect('/admin');
});

app.post('/gen-key', async (req, res) => {
    if (!req.session.reseller) return res.redirect('/login');
    const user = await User.findOne({ username: req.session.reseller });
    if (user.points < 1) return res.send("No Points!");
    const k = new Key({ key: "KURO-" + Math.random().toString(36).substring(7).toUpperCase(), duration: req.body.time + " " + req.body.type, devices: req.body.dev, reseller: user.username });
    await k.save();
    await User.updateOne({ username: user.username }, { $inc: { points: -1 } });
    res.send(`<h1>KEY: ${k.key}</h1><a href='/reseller'>Back</a>`);
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server Live!"));
