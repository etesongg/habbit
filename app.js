const express = require("express");
const app = express();
const PORT = 3000;

const sqlite3 = require("sqlite3");
const path = require("path");
const db_name = path.join(__dirname, "habit.db");
const db = new sqlite3.Database(db_name);

app.set("view engine", "ejs");
app.engine("ejs", require("express-ejs-extend"));
app.use(express.urlencoded({ extended: true }));

const create_users_table = `
    CREATE TABLE users(
        id integer PRIMARY KEY AUTOINCREMENT,
        name varchar,
        email varchar unique,
        password varchar,
        createAt datetime DEFAULT CURRENT_TIMESTAMP
    );`;
const create_habits_table = `
    CREATE TABLE habits (
        id integer PRIMARY KEY AUTOINCREMENT,
        habit_name varchar,
        start_date datetime,
        end_date datetime,
        createAt datetime DEFAULT CURRENT_TIMESTAMP,
        user_id integer not null,
        FOREIGN KEY(user_id) REFERENCES users(id)
    );`;
const create_records_table = `
    CREATE TABLE records (
        id integer PRIMARY KEY AUTOINCREMENT,
        memo varchar,
        createAt datetime DEFAULT CURRENT_TIMESTAMP,
        habit_id integer NOT NULL,
        FOREIGN KEY(habit_id) REFERENCES habits(id)
    );`;

// db.serialize(() => {
//   db.run(create_users_table);
//   db.run(create_habits_table);
//   db.run(create_records_table);
// });

let getSql = ``;
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/habit_list/:id", (req, res) => {
  const { id } = req.params;
  getSql = `
    SELECT h.id, h.habit_name AS "name", h.start_date || " ~ " || h.end_date AS "date", COUNT(r.id) AS record_count, MAX(r.id) AS "record_id"
    FROM users u 
    JOIN habits h ON u.id = h.user_id 
    LEFT JOIN records r ON r.habit_id = h.id 
    WHERE u.id = ${id}
    GROUP BY h.id, h.habit_name, h.start_date, h.end_date`;
  db.all(getSql, (err, rows) => {
    if (err) {
      res.status(500).send("html 500 error");
    } else {
      const habits = rows;
      res.render("habit_list", { habits: habits, user_id: id });
    }
  });
});

app.get("/habit_add/:id", (req, res) => {
  const { id } = req.params;
  res.render("habit_add", { user_id: id });
});

app.post("/habit_add/:id", (req, res) => {
  const { id } = req.params;
  const { habit_name, start_date, end_date } = req.body;
  getSql = `
    INSERT INTO habits(habit_name, start_date, end_date, user_id) VALUES ('${habit_name}', '${start_date}', '${end_date}', '${id}')`;
  db.run(getSql, (err) => {
    if (err) {
      res.status(500).send("html 500 error");
    } else {
      res.redirect(`/habit_list/${id}`);
    }
  });
});

app.get("/habit_delete/:user_id/:id", (req, res) => {
  const { id, user_id } = req.params;
  getSql = `
    DELETE FROM habits WHERE id = ${id}`;
  db.run(getSql, (err) => {
    if (err) {
      res.status(500).send("html 500 error");
    } else {
      res.redirect(`/habit_list/${user_id}`);
    }
  });
});

app.get("/habit_record_list/:id", (req, res) => {
  const { id } = req.params; // habit_id
  getSql = `
  SELECT r.id AS "id", r.memo AS "memo", r.createAt AS "createAt" 
  FROM records r
  JOIN habits h
  ON r.habit_id = h.id
  WHERE r.habit_id = ${id}`;
  db.all(getSql, (err, rows) => {
    if (err) {
      res.status(500).send("html 500 error");
    } else {
      res.render(`habit_record_list`, { records: rows, habit_id: id });
    }
  });
});

app.get("/habit_record_add/:id", (req, res) => {
  const { id } = req.params;
  res.render("habit_record_add", { habit_id: id });
});

app.post("/habit_record_add/:id", (req, res) => {
  const { id } = req.params;
  const { memo } = req.body;
  getSql = `
    INSERT INTO records(memo, habit_id) 
    VALUES('${memo}','${id}')`;
  db.run(getSql, (err) => {
    if (err) {
      res.status(500).send("html 500 error");
    } else {
      res.redirect(`/habit_record_list/${id}`);
    }
  });
});

app.get("/habit_record_delete/:habit_id/:id", (req, res) => {
  const { id, habit_id } = req.params; // id = recode_id
  getSql = `
    DELETE FROM records WHERE id = ${id}`;
  db.run(getSql, (err) => {
    if (err) {
      res.status(500).send("html 500 error");
    } else {
      res.redirect(`/habit_record_list/${habit_id}`);
    }
  });
});

app.listen(PORT, () => {
  console.log(`${PORT}에서 습관관리 사이트 웹서버 실행 중`);
});
