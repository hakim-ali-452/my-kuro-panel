const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'kuro_secret_key', resave: false, saveUninitialized: true }));

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
const ADMIN_PASS = "kuro123"; // Ise aap badal sakte hain

// --- ROUTES ---

// 1. Login Page
app.get('/login', (req, res) => {
    res.send(`
        <body style="background:#000; color:#0f0; text-align:center; font-family:sans-serif; padding-top:100px;">
            <h1 style="text-shadow:0 0 10px #0f0;">🔐 KURO PANEL LOGIN</h1>
            <form action="/login" method="POST" style="background:#111; display:inline-block; padding:40px; border-radius:15px; border:1px solid #0f0;">
                <input name="user" placeholder="Username" style="padding:12px; width:250px; margin-bottom:15px;" required><br>
                <input name="pass" type="password" placeholder="Password" style="padding:12px; width:250px; margin-bottom:15px;" required><br>
                <button type="submit" style="background:#0f0; color:#000; padding:12px 40px; border:none; font-weight:bold; cursor:pointer; border-radius:5px;">LOGIN</button>
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
    res.send("Invalid Login! <a href='/login'>Try Again</a>");
});

// 2. Admin Dashboard (Reseller Manage karne ke liye)
app.get('/admin', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    const resellers = await User.find({ role: 'reseller' });
    res.send(`
        <body style="background:#000; color:#fff; font-family:sans-serif; text-align:center;">
            <h1 style="color:#0f0;">💎 ADMIN CONTROL PANEL 💎</h1>
            <div style="background:#111; padding:20px; display:inline-block; border:1px solid #333; border-radius:10px;">
                <h3>Add New Reseller</h3>
                <form action="/add-reseller" method="POST">
                    <input name="u" placeholder="Username" required>
                    <input name="p" placeholder="Password" required>
                    <input name="pts" type="number" placeholder="Points" required>
                    <button type="submit" style="background:#0f0;">ADD</button>
                </form>
            </div>
            <br><br><h3>Active Resellers</h3>
            <table border="1" style="margin:auto; width:80%; color:#0f0;">
                <tr><th>User</th><th>Points</th><th>Action</th></tr>
                ${resellers.map(r => `<tr><td>${r.username}</td><td>${r.points}</td><td><a href="/del/${r._id}" style="color:red;">Delete</a></td></tr>`).join('')}
            </table>
            <br><a href="/logout" style="color:yellow;">Logout</a>
        </body>
    `);
});

// 3. Reseller Dashboard (Key Generate karne ke liye)
app.get('/reseller', async (req, res) => {
    if (!req.session.reseller) return res.redirect('/login');
    const data = await User.findOne({ username: req.session.reseller });
    res.send(`
        <body style="background:#000; color:#fff; font-family:sans-serif; text-align:center;">
            <h2 style="color:#0f0;">Welcome ${data.username} | Points: ${data.points}</h2>
            <div style="background:#111; padding:30px; display:inline-block; border-radius:15px; border:1px solid #0f0;">
                <h3>GENERATE KEY</h3>
                <form action="/gen-key" method="POST">
                    <select name="type" style="padding:10px; width:220px;">
                        <option value="Minutes">Minutes</option>
                        <option value="Hours">Hours</option>
                        <option value="Days">Days</option>
                    </select><br><br>
                    <input name="time" type="number" placeholder="How many? (e.g. 30)" style="padding:10px; width:200px;" required><br><br>
                    <input name="dev" type="number" placeholder="Device Limit" style="padding:10px; width:200px;" required><br><br>
                    <button type="submit" style="background:#0f0; padding:12px 30px; font-weight:bold; cursor:pointer;">GENERATE (-1 Point)</button>
                </form>
            </div>
            <br><br><a href="/logout" style="color:red;">Logout</a>
        </body>
    `);
});

// 4. Logic Functions
app.post('/add-reseller', async (req, res) => {
    if (!req.session.admin) return res.redirect('/login');
    await new User({ username: req.body.u, password: req.body.p, points: req.body.pts, role: 'reseller' }).save();
    res.redirect('/admin');
});

app.post('/gen-key', async (req, res) => {
    if (!req.session.reseller) return res.redirect('/login');
    const user = await User.findOne({ username: req.session.reseller });
    if (user.points < 1) return res.send("No Points! <a href='/reseller'>Back</a>");

    const k = new Key({
        key: "KURO-" + Math.random().toString(36).substring(2, 9).toUpperCase(),
        duration: req.body.time + " " + req.body.type,
        devices: req.body.dev,
        reseller: user.username
    });
    await k.save();
    await User.updateOne({ username: user.username }, { $inc: { points: -1 } });
    res.send(\`
        <body style="background:#000; color:#0f0; text-align:center; padding:50px;">
            <h1>KEY: \${k.key}</h1>
            <p>Valid for: \${k.duration}</p>
            <a href="/reseller" style="color:#fff;">Generate More</a>
        </body>
    \`);
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

// --- START SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Kuro Panel Active on Port " + PORT));
