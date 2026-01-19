const express = require('express');
const router = express.Router();
const exe = require("../config/db");
// const session = require('express-session');


// Home Page
router.get("/", async (req, res) => {
    let about = await exe("SELECT * FROM home_about LIMIT 1");
    var plans = await exe("SELECT * FROM membership_plans");
    var packet = { about, plans };
    res.render("user/home", packet);
});


router.get("/about", function (req, res) {
    res.render("user/about.ejs");
});

// User Trainer Page........................................................................................
router.get("/trainer", async function (req, res) {
    var sql = `SELECT * FROM trainers`;
    var data = await exe(sql);
    console.log(data);
    res.render("user/trainer.ejs", { data });
});
router.post("/book_trainer", async (req, res) => {
    var { user_name, mobile, category, trainer_name } = req.body;

    var sql = `
      INSERT INTO trainer_bookings
      (user_name, mobile, category, trainer_name)
      VALUES (?,?,?,?)
    `;

    await exe(sql, [user_name, mobile, category, trainer_name]);

    res.redirect("/trainer");   // user page
});

// User Trainer Page END........................................................................................


// User Membership Page....................................................................................
router.get("/membership", async (req, res) => {
    var data = await exe("SELECT * FROM membership_plans");
    res.render("user/membership", { data });
});

// User membership Page END..............................................................................


// User Gallery Page....................................................................................
router.get("/gallery", async (req, res) => {
    const rows = await exe("SELECT * FROM gallery");
    res.render("user/gallery.ejs", { gallery: rows });
});

// User Gallery Page END................................................................................

// contact page form START......................................................................................

router.post("/contact_enquiry", async function (req, res) {
    var d = req.body;
    var sql = `INSERT INTO contact_messages (full_name, email, message) VALUES (?, ?, ?)`;
    var result = await exe(sql, [d.full_name, d.email, d.message]);
    res.redirect("/contact");
});

router.get("/contact", async (req, res) => {
    var gymData = await exe("SELECT * FROM gym_info LIMIT 1");
    res.render("user/contact", { gym: gymData[0] });
});


// contact page form END......................................................................................




module.exports = router;
