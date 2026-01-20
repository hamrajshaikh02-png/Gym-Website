var express = require('express');
var app = express();
var bodyParser = require('body-parser');
const fileUpload = require("express-fileupload");
const session = require('express-session');   // ✅ only one time

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: "admin-secret",
  resave: false,
  saveUninitialized: false
}));


app.set("view engine", "ejs");
app.use(express.static('public/'));
app.use(fileUpload());
var adminRoutes = require("./routes/admin");
var userRoutes = require("./routes/user");

app.use("/admin", adminRoutes);
app.use("/", userRoutes);

app.listen(1000, ()=>{
    console.log("Server running on port 1000");
});
