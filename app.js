const express = require("express");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
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

app.set("view engine", "ejs");
app.engine("ejs", require("express-ejs-extend"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  getSql = `
  SELECT id
  FROM users
  WHERE email = '${username}' AND password = '${password}'`;
  db.get(getSql, (err, row) => {
    if (err) {
      return res.status(500).send("html 500 error");
    } else {
      if (row) {
        return res.redirect(`/habit_list/${row.id}`);
      } else {
        return res.status(401).send("로그인에 실패했습니다.");
      }
    }
  });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/logout", (req, res) => {
  const { user } = req.session;
  if (user) {
    user = null;
  }
  res.redirect("/login");
});

app.get("/habit_list/:user_id", (req, res) => {
  const { user_id } = req.params;
  const { user } = req.session;
  if (user) {
    res.render("habit_list");
  } else {
    res.redirect("/login");
  }

  getSql = `
    SELECT h.id, h.habit_name AS "name", h.start_date || " ~ " || h.end_date AS "date", COUNT(r.id) AS record_count, MAX(r.id) AS "record_id"
    FROM users u 
    JOIN habits h ON u.id = h.user_id 
    LEFT JOIN records r ON r.habit_id = h.id 
    WHERE u.id = ${user_id}
    GROUP BY h.id, h.habit_name, h.start_date, h.end_date`;
  db.all(getSql, (err, rows) => {
    if (err) {
      res.status(500).send("html 500 error");
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
    INSERT INTO habits(habit_name, start_date, end_date, user_id) VALUES ('${habit_name}', '${start_date}', '${end_date}', '${user_id}')`;
  db.run(getSql, (err) => {
    if (err) {
      res.status(500).send("html 500 error");
    } else {
      res.redirect(`/habit_list/${user_id}`);
    }
  });
});

app.get("/habit_delete/:user_id/:habit_id", (req, res) => {
  const { user_id, habit_id } = req.params;
  getSql = `
    DELETE FROM habits WHERE id = ${habit_id}`;
  db.run(getSql, (err) => {
    if (err) {
      res.status(500).send("html 500 error");
    } else {
      res.redirect(`/habit_list/${user_id}`);
    }
  });
});

app.get("/habit_record_list/:user_id/:habit_id", (req, res) => {
  const { user_id, habit_id } = req.params;
  getSql = `
  SELECT r.id AS "id", r.memo AS "memo", r.createAt AS "createAt" 
  FROM records r
  JOIN habits h
  ON r.habit_id = h.id
  WHERE r.habit_id = ${habit_id}`;
  db.all(getSql, (err, rows) => {
    if (err) {
      res.status(500).send("html 500 error");
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
    VALUES('${memo}','${habit_id}')`;
  db.run(getSql, (err) => {
    if (err) {
      res.status(500).send("html 500 error");
    } else {
      res.redirect(`/habit_record_list/${user_id}/${habit_id}`);
    }
  });
});

app.get("/habit_record_delete/:habit_id/:record_id", (req, res) => {
  const { habit_id, record_id } = req.params;
  getSql = `
    DELETE FROM records WHERE id = ${record_id}`;
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
