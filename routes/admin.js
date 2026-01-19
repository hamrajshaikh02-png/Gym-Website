const express = require('express');
const { route } = require('./admin');
const { name } = require('ejs');
const exe = require('../config/db');
const session = require('express-session');
const router = express.Router();

// Admin Login START..........................................................................................


// GET login page
router.get("/login", function (req, res) {
  res.render("admin/login", { err: "" });
});

router.post("/login", async function (req, res) {
  try {
    const { email, password } = req.body;

    const adminData = await exe(
      "SELECT * FROM admin WHERE email=?",
      [email]
    );

    if (adminData.length === 0) {
      return res.render("admin/login", { err: "Invalid Email" });
    }

    if (adminData[0].password !== password) {
      return res.render("admin/login", { err: "Invalid Password" });
    }

    // ✅ session set
    req.session.admin = adminData[0];
    req.session.save(() => {
      res.redirect("/admin/dashboard");
    });


  } catch (err) {
    console.log(err);
    res.send("Error");
  }
});


// middleware
function isLogginIn(req, res, next) {
  if (req.session && req.session.admin) {
    next(); // ✅ allow dashboard
  } else {
    res.redirect("/admin/login"); // ❌ block direct access
  }
}

//  Admin Login END............................................................................................

// dashboard start................................................................................
router.get("/dashboard", isLogginIn, async function (req, res) {

  const totalEnquiry = await exe("SELECT COUNT(*) as total FROM contact_messages");
  const totalUsers = await exe("SELECT COUNT(*) as total FROM user1");
  const totalTrainer = await exe("SELECT COUNT(*) as total FROM trainers");
  const totalPlans = await exe("SELECT COUNT(*) as total FROM membership_plans");
  const totalGallery = await exe("SELECT COUNT(*) as total FROM gallery");

  res.render("admin/dashboard", {
    enquiry: totalEnquiry[0].total,
    users: totalUsers[0].total,
    trainers: totalTrainer[0].total,
    plans: totalPlans[0].total,
    gallery: totalGallery[0].total
  });
});



// dashboard END..............................................................................................
// Home About section START.....................................................................................
router.get("/home", async function async(req, res) {
  let data = await exe("SELECT * FROM home_about LIMIT 1");

  res.render("admin/home.ejs", { about: data[0] });
});


router.post("/update_home_about", async (req, res) => {
  try {
    const { title, description } = req.body;
    let imageName = null;

    // If new image uploaded
    if (req.files && req.files.image) {
      let image = req.files.image;
      imageName = Date.now() + "_" + image.name;
      await image.mv("public/images/" + imageName);
    }

    let sql = "";
    let values = [];

    if (imageName) {
      sql = "UPDATE home_about SET title=?, description=?, image=? WHERE id=1";
      values = [title, description, imageName];
    } else {
      sql = "UPDATE home_about SET title=?, description=? WHERE id=1";
      values = [title, description];
    }

    await exe(sql, values);

    res.redirect("/admin/home");

  } catch (err) {
    console.log(err);
    res.send("Image upload failed");
  }
});

// Home About section END.....................................................................................



// About Page section START..................................................................................
router.get("/about", function (req, res) {
  res.render("admin/about.ejs")
});

// Trainer Profile section START.....................................................................................
router.get("/trainers", async function (req, res) {

  var trainers = await exe("SELECT * FROM trainers");
  var bookings = await exe("SELECT * FROM trainer_bookings ORDER BY id DESC");

  res.render("admin/trainer", {
    trainers,
    bookings
  });
});


// UPDATE TRAINER PAGE
router.get("/update-trainer/:id", async function (req, res) {
  var id = req.params.id;
  var data = await exe("SELECT * FROM trainers WHERE id = ?", [id]);

  var packet = { data };

  res.render("admin/update_trainer", packet);
});


// UPDATE TRAINER
router.post("/update_trainer_profile", async (req, res) => {
  try {
    var { id, name, specialization, experience, training_type, photo } = req.body;

    if (req.files && req.files.photo) {
      // New photo uploaded
      let imageFile = req.files.photo;
      let filename = Date.now() + "_" + imageFile.name;
      await imageFile.mv("public/images/" + filename);

      var sql = `
      UPDATE trainers SET
      name = ?,
      specialization = ?,
      experience = ?,
      training_type = ?,
      photo = ?
      WHERE id = ?
    `;
      await exe(sql, [name, specialization, experience, training_type, filename, id]);
    } else {
      // No new photo, keep existing
      var sql = `
      UPDATE trainers SET
      name = ?,
      specialization = ?,
      experience = ?,
      training_type = ?
      WHERE id = ?
    `;
      await exe(sql, [name, specialization, experience, training_type, id]);
    }

  } catch (err) {
    console.log(err);
  }
  res.redirect("/admin/trainers");
});

// DELETE Booking
router.get("/delete_booking/:id", async (req, res) => {
  await exe("DELETE FROM trainer_bookings WHERE id=?", [req.params.id]);
  res.redirect("/admin/trainers");
});
// Trainer Profile section END................................................................................... 


// Membership plan section START...............................................................................
router.get("/memberships", async (req, res) => {
  var data = await exe("SELECT * FROM membership_plans");
  res.render("admin/membership", { data });

});

router.post("/save-membership", async (req, res) => {

  var {
    plan_name,
    trainer_type,
    price,
    features,
    button_text,
    button_url
  } = req.body;

  var sql = `
    INSERT INTO membership_plans
    (plan_name, trainer_type, price, features, button_text, button_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  await exe(sql, [
    plan_name,
    trainer_type,
    price,
    features,
    button_text,
    button_url
  ]);

  res.redirect("/admin/memberships");
});

// DELETE MEMBERSHIP
router.get("/delete-membership/:id", async (req, res) => {
  var id = req.params.id;
  await exe("DELETE FROM membership_plans WHERE id=?", [id]);
  res.redirect("/admin/memberships");
});

// EDIT PAGE
router.get("/edit-membership/:id", async (req, res) => {
  var id = req.params.id;
  var data = await exe("SELECT * FROM membership_plans WHERE id=?", [id]);
  res.render("admin/edit_membership", { p: data[0] });
});

// UPDATE MEMBERSHIP
router.post("/update-membership/:id", async (req, res) => {
  var id = req.params.id;

  var {
    plan_name,
    trainer_type,
    price,
    features,
    button_text,
    button_url
  } = req.body;

  await exe(`
    UPDATE membership_plans SET
      plan_name=?,
      trainer_type=?,
      price=?,
      features=?,
      button_text=?,
      button_url=?
    WHERE id=?
  `, [
    plan_name,
    trainer_type,
    price,
    features,
    button_text,
    button_url,
    id
  ]);

  res.redirect("/admin/memberships");
});
// Membership plan section END...................................................................



// ================= ADMIN GALLERY PAGE =================
router.get("/gallery", async (req, res) => {
  const rows = await exe("SELECT * FROM gallery");
  res.render("admin/gallery.ejs", { gallery: rows });
});

router.post("/add-gallery", async (req, res) => {
  const { section, title } = req.body;
  let images = req.files.images;

  if (!Array.isArray(images)) images = [images];

  for (let img of images) {
    let filename = Date.now() + "_" + img.name;
    await img.mv("public/images/" + filename);

    await exe(
      "INSERT INTO gallery (section,title,image) VALUES (?,?,?)",
      [section, title, filename]
    );
  }
  res.redirect("/admin/gallery");
});

router.get("/delete_gallery/:id", async (req, res) => {
  await exe("DELETE FROM gallery WHERE id=?", [req.params.id]);
  res.redirect("/admin/gallery");
});
// Admin gallery page END......................................................................................



// ================= ADMIN CONTACT PAGE =================
// Show Contact Enquiries + Gym Info
router.get("/contact", async (req, res) => {
  try {
    var contacts = await exe("SELECT * FROM contact_messages ORDER BY id DESC");
    var gymData = await exe("SELECT * FROM gym_info LIMIT 1");

    res.render("admin/contact", {
      data: contacts,    // enquiry list
      gym: gymData[0]    // gym info
    });
  } catch (err) {
    console.log(err);
    res.send("Error loading contact page");
  }
});

// Delete enquiry
router.get("/delete_contact/:id", async (req, res) => {
  try {
    await exe("DELETE FROM contact_messages WHERE id=?", [req.params.id]);
    res.redirect("/admin/contact");
  } catch (err) {
    console.log(err);
    res.send("Delete failed");
  }
});

// Update Gym Info
router.post("/update_gym_info", async (req, res) => {
  try {
    var { id, address, phone, email, map_embed } = req.body;

    await exe(
      "UPDATE gym_info SET address=?, phone=?, email=?, map_embed=? WHERE id=?",
      [address, phone, email, map_embed, id]
    );

    res.redirect("/admin/contact");
  } catch (err) {
    console.log(err);
    res.send("Update failed");
  }
});
// Admin contact page form END......................................................................................



module.exports = router;