const express = require("express");
const fs = require('fs')
const moment = require('moment')
const sqlite3 = require("sqlite3");
const path = require("path");

// database setting
const db_name = path.join(__dirname, "habit.db");
const db = new sqlite3.Database(db_name);

const app = express();
const PORT = 3001;

app.use(express.json())

// localhost:3001/users
app.get('/users', (req, res)=> {
    const users_sql = `
    SELECT * 
    FROM users`
    db.all(users_sql, [], (err, rows)=> {
        res.json({users:rows})
    })
})

// localhost:3001/users/habit_list/2
app.get("/users/habit_list/:user_id", (req, res) => {
    const { user_id } = req.params;
  
    let page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = 8;
    const offset = (page - 1) * limit;
  
    getSql = `
      SELECT h.id, h.habit_name AS name, h.start_date, h.end_date, 
             COUNT(r.id) AS record_count, MAX(r.id) AS record_id,
             (SELECT COUNT(1) FROM habits WHERE user_id = ?) AS total
      FROM habits h
      LEFT JOIN records r ON r.habit_id = h.id
      WHERE h.user_id = ?
      GROUP BY h.id, h.habit_name, h.start_date, h.end_date
      ORDER BY h.id
      LIMIT ? OFFSET ?`;
  
    db.all(getSql, [user_id, user_id, limit, offset], (err, rows) => {
      if (err) {
        return res.status(500).send("HTML 500 ERROR") 
      }
  
      if (rows.length > 0) {
        const total = rows[0].total; 
        const totalPage = Math.ceil(total / limit);
        
        res.json({ habits: rows })
      } else {
        res.json({ habits: rows })
      }
    });
});

// localhost:3001/users/habit_add/2 => body -> raw (json) -> 입력할 데이터 적기 {"habit_name":"json test","start_date":"2024-11-01", "end_date": "2024-11-30"}
app.post("/users/habit_add/:user_id", (req, res) => {
    const { user_id } = req.params;
    const { habit_name, start_date, end_date } = req.body;
    getSql = `
        INSERT INTO habits(habit_name, start_date, end_date, user_id) VALUES (?,?,?,?)`;
    db.run(getSql, [habit_name, start_date, end_date, user_id], (err) => {
        if (err) {
        res.status(500).send("HTML 500 ERROR") 
        } else {
        res.redirect(`/users/habit_list/${user_id}`);
        }
    });
});

// localhost:3001/users/habit_delete/2/33
app.delete("/users/habit_delete/:user_id/:habit_id", (req, res) => {
    const { user_id, habit_id } = req.params;
    getSql = `
        DELETE FROM habits WHERE id = ?`;
    db.run(getSql, [habit_id],(err, row) => {
        if (err) {
        res.status(500).send("HTML 500 ERROR") 
        } else {
        getSql = `
            DELETE FROM records
            WHERE habit_id = ${habit_id}`;
        db.run(getSql);
        res.redirect(`/users/habit_list/${user_id}`);
        }
    });
});

// localhost:3001/users/habit_record_list/2/1
app.get("/users/habit_record_list/:user_id/:habit_id", (req, res) => {
    const { user_id, habit_id } = req.params;
    getSql = `
    SELECT r.id AS "id", r.memo AS "memo", strftime('%Y-%m-%d',r.createAt) AS "createAt" 
    FROM records r
    JOIN habits h
    ON r.habit_id = h.id
    WHERE r.habit_id = ?`;
    db.all(getSql, [habit_id],(err, rows) => {
      if (err) {
        res.status(500).send("HTML 500 ERROR") 
      } else {
        res.json({ records: rows })
      }
    });
});

// localhost:3001/users/habit_record_add/2/1
app.post("/users/habit_record_add/:user_id/:habit_id", (req, res) => {
    const { user_id, habit_id } = req.params;
    const { memo } = req.body;
    getSql = `
      INSERT INTO records(memo, habit_id) 
      VALUES(?,?)`;
    db.run(getSql, [memo, habit_id],(err) => {
      if (err) {
        res.status(500).send("HTML 500 ERROR") 
      } else {
        res.redirect(`/users/habit_record_list/${user_id}/${habit_id}`);
      }
    });
});

// localhost:3001/users/habit_record_delete/2/1/59
app.delete("/users/habit_record_delete/:user_id/:habit_id/:record_id", (req, res) => {
    const { user_id, habit_id, record_id } = req.params;
    getSql = `
      DELETE FROM records WHERE id = ?`;
    db.run(getSql, [record_id], (err) => {
      if (err) {
        res.status(500).send("HTML 500 ERROR") 
      } else {
        res.redirect(`/users/habit_record_list/${user_id}/${habit_id}`);
      }
    });
  });

app.listen(PORT, () => {
    console.log(`${PORT}에서 습관관리 사이트 웹서버 실행 중`);
  });