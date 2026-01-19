var mysql = require("mysql2");
var util = require("util");
require("dotenv").config();

var conn = mysql.createConnection({
    host: process.env.HOST,
    user: process.env.USER,
    password: process.env.PASSWORD,
    database: process.env.DATABASE
});

conn.connect((err) => {
    if (err) {
        console.log("❌ Database Connection Failed");
        console.log(err);
    } else {
        console.log("✅ Database Connected");
    }
});

// Promisify after conn is created
var exe = util.promisify(conn.query).bind(conn);

module.exports = exe;
