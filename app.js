const express = require("express");
const app = express();
app.use(express.json());
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");

const dbPath = path.join(__dirname, "userData.db");
let db = null;

initializeDatabaseServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => console.log("Server Running...."));
  } catch (e) {
    console.log(`Database Error ${e.message}`);
    process.exit(1);
  }
};

initializeDatabaseServer();

app.post("/register", async (request, response) => {
  let userDetails = request.body;
  const { username, name, password, gender, location } = userDetails;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUserQuery = `SELECT * FROM user WHERE username='${username}'`;
  const getUser = await db.get(getUserQuery);
  if (getUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const createUserQuery = `INSERT INTO user(username, name, password, gender, location)
        VALUES('${username}','${name}','${hashedPassword}','${gender}','${location}')`;
      await db.run(createUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const getUserPasswordQuery = `SELECT * FROM user WHERE username = '${username}'`;
  let userObj = undefined;
  userObj = await db.get(getUserPasswordQuery);
  if (userObj === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    let userHashedPassword = userObj.password;
    let comparePassword = await bcrypt.compare(password, userHashedPassword);
    if (comparePassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  let userDetails = request.body;
  let { username, oldPassword, newPassword } = userDetails;
  let currentPasswordQuery = `SELECT password FROM user WHERE username = '${username}'`;
  let currentUserPassword = await db.get(currentPasswordQuery);
  let currentPassword = currentUserPassword.password;
  let comparePassword = await bcrypt.compare(oldPassword, currentPassword);
  if (comparePassword === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const updatePasswordQuery = `UPDATE user SET password = '${hashedNewPassword}' WHERE username = '${username}'`;
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});

module.exports = app;
