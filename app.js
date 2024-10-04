const express = require("express");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
// const ejsExtend = require('express-ejs-extend');
const layout = require("express-ejs-layouts");
const app = express();
const PORT = 3000;

const sqlite3 = require("sqlite3");
const path = require("path");
const db_name = path.join(__dirname, "habit.db");
const db = new sqlite3.Database(db_name);

const {
  create_users_table,
  create_habits_table,
  create_records_table,
} = require("./models/create_table");
const { render } = require("ejs");

app.set("view engine", "ejs");
app.use(express.static("public"));
app.engine("ejs", require("express-ejs-extend"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// app.engine('ejs', ejsExtend);
app.use(layout);
app.set("layout", "layouts/layout");

app.use(
  expressSession({
    secret: "habit-bysong",
    resave: true,
    saveUninitialized: true,
  })
);

// db.serialize(() => {
//   db.run(create_users_table);
//   db.run(create_habits_table);
//   db.run(create_records_table);
// });

let getSql = ``;
let isRegister = false;

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  getSql = `
  SELECT id
  FROM users
  WHERE email = ? AND password = ?`;
  db.get(getSql, [username, password],(err, row) => {
    if (err) {
      res.render("error",  { error: "HTML 500 ERROR" });
    } else {
      if (row) {
        req.session.user = {
          id: row.id,
          username: row.username,
          name: row.name,
          authorized: true,
        };
        res.redirect(`/habit_list/${row.id}`);
      } else {
        res.render("error", { error: "로그인에 실패했습니다." });
      }
    }
  });
});

app.get("/register", (req, res) => {
  res.render("register", {
    isEmailDuplicate: false,
    message: "",
    name: "",
    username: "",
    password: "",
  });
});

app.post("/register", (req, res) => {
  const { name, username, password } = req.body;
  getSql = `
  SELECT COUNT(1) AS count 
  FROM users
  WHERE email = ?`;
  db.get(getSql, [username],(err, row) => {
    if (err) {
      res.render("error", { error: "HTML 500 ERROR" });
    } else {
      if (row.count > 0) {
        console.log("이메일 이미 존재");
        res.render("register", {
          isEmailDuplicate: true,
          message: "This email is already in use.",
          name,
          username,
          password,
        });
      } else {
        getSql = `
        INSERT INTO users(name, email, password) VALUES(?, ?, ?)`;
        db.run(getSql, [name, username, password]);
        res.redirect("/login");
      }
    }
  });
});

app.get("/logout", (req, res) => {
  try {
    req.session.destroy(() => {
      const username = req.session?.user?.username;
      console.log(username, " 로그아웃");
      res.redirect("/login");
    });
  } catch (error) {
    console.error("session logout error:", error);
    res.render("error", { error: "LOGOUT ERROR" });
  }
});

app.get("/habit_list/:user_id", (req, res) => {
  const { user_id } = req.params;
  const { user } = req.session;

  if (!user) {
    return res.redirect("/login");
  }

  getSql = `
    SELECT h.id, h.habit_name AS "name", h.start_date, h.end_date , COUNT(r.id) AS record_count, MAX(r.id) AS "record_id"
    FROM users u 
    JOIN habits h ON u.id = h.user_id 
    LEFT JOIN records r ON r.habit_id = h.id 
    WHERE u.id = ?
    GROUP BY h.id, h.habit_name, h.start_date, h.end_date`;
  db.all(getSql, [user_id], (err, rows) => {
    if (err) {
      res.render("error", { error: "HTML 500 ERROR" });
    } else {
      const habits = rows;
      res.render("habit_list", { habits: habits, user_id: user_id });
    }
  });
});

app.get("/habit_add/:user_id", (req, res) => {
  const { user_id } = req.params;
  res.render("habit_add", { user_id: user_id });
});

app.post("/habit_add/:user_id", (req, res) => {
  const { user_id } = req.params;
  const { habit_name, start_date, end_date } = req.body;
  getSql = `
    INSERT INTO habits(habit_name, start_date, end_date, user_id) VALUES (?,?,?,?)`;
  db.run(getSql, [habit_name, start_date, end_date, user_id], (err) => {
    if (err) {
      res.render("error", { error: "HTML 500 ERROR" });
    } else {
      res.redirect(`/habit_list/${user_id}`);
    }
  });
});

app.get("/habit_delete/:user_id/:habit_id", (req, res) => {
  const { user_id, habit_id } = req.params;
  getSql = `
    DELETE FROM habits WHERE id = ?`;
  db.run(getSql, [habit_id],(err, row) => {
    if (err) {
      res.render("error", { error: "HTML 500 ERROR" });
    } else {
      getSql = `
        DELETE FROM records
        WHERE habit_id = ${habit_id}`;
      db.run(getSql);
      res.redirect(`/habit_list/${user_id}`);
    }
  });
});

app.get("/habit_record_list/:user_id/:habit_id", (req, res) => {
  const { user_id, habit_id } = req.params;
  getSql = `
  SELECT r.id AS "id", r.memo AS "memo", strftime('%Y-%m-%d',r.createAt) AS "createAt" 
  FROM records r
  JOIN habits h
  ON r.habit_id = h.id
  WHERE r.habit_id = ?`;
  db.all(getSql, [habit_id],(err, rows) => {
    if (err) {
      res.render("error", { error: "HTML 500 ERROR" });
    } else {
      res.render(`habit_record_list`, {
        records: rows,
        user_id: user_id,
        habit_id: habit_id,
      });
    }
  });
});

app.get("/habit_record_add/:user_id/:habit_id", (req, res) => {
  const { user_id, habit_id } = req.params;
  res.render("habit_record_add", { user_id: user_id, habit_id: habit_id });
});

app.post("/habit_record_add/:user_id/:habit_id", (req, res) => {
  const { user_id, habit_id } = req.params;
  const { memo } = req.body;
  getSql = `
    INSERT INTO records(memo, habit_id) 
    VALUES(?,?)`;
  db.run(getSql, [memo, habit_id],(err) => {
    if (err) {
      res.render("error", { error: "HTML 500 ERROR" });
    } else {
      res.redirect(`/habit_record_list/${user_id}/${habit_id}`);
    }
  });
});

app.get("/habit_record_delete/:user_id/:habit_id/:record_id", (req, res) => {
  const { user_id, habit_id, record_id } = req.params;
  getSql = `
    DELETE FROM records WHERE id = ?`;
  db.run(getSql, [record_id], (err) => {
    if (err) {
      res.render("error", { error: "HTML 500 ERROR" });
    } else {
      res.redirect(`/habit_record_list/${user_id}/${habit_id}`);
    }
  });
});

app.listen(PORT, () => {
  console.log(`${PORT}에서 습관관리 사이트 웹서버 실행 중`);
});
