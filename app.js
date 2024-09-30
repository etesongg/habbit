const express = require("express");
const app = express();
const PORT = 3000;

const sqlite3 = require("sqlite3");
const path = require("path");
const db_name = path.join(__dirname, "habbit.db");
const db = new sqlite3.Database(db_name);

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}))

const create_users_table = `
    create table if not exists users (
        id integer primary key autoincrement,
        email varchar,
        name varchar,
        password varchar,
        createAt datetime current_timestamp,
        unique(email)
    );`
const create_habits_table = `
    create table if not exists habits (
        id integer primary key autoincrement,
        name varchar,
        start_date datetime,
        end_date datetime,
        createdAt datetime,
        user_id integer,
        foreign key(user_id) references users(id)
    );`
const create_records_table = `
    create table if not exists records (
        id integer primary key autoincrement,
        memo text,
        createdAt datetime,
        habit_id integer,
        foreign key(habit_id) references habits(id)
    );`

db.serialize(()=> {
    db.run(create_users_table)
    db.run(create_habits_table)
    db.run(create_records_table)
})

let getSql = ``
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res)=> {
    res.render('register')
})

app.get('/habbit_list/:id', (req, res)=> {
    const { id } = req.params
    getSql = `
    select h.id, h.name AS "name", h.start_date || "~" || h.end_date AS "date", count(r.id) AS record_count
    from users u 
	join habits h on u.id = h.user_id 
	join records r on r.habit_id = h.id where u.id = ${id}
    group by h.id, h.name, h.start_date, h.end_date`
    db.all(getSql, (err, rows)=> {
        if(err){
            res.status(500).send('html 500 error')
        }else {
            const habbits = rows
            res.render('habbit_list', {habbits: habbits})
        }
    })
    
})

app.get('/habbit_add', (req, res)=> {
    res.render('habbit_add')
})

app.get('/habbit_record_list', (req, res)=> {
    res.render('habbit_record_list')
})

app.get('/habbit_record_add', (req, res)=> {
    res.render('habbit_record_add')
})

app.listen(PORT, () => {
  console.log(`${PORT}에서 습관관리 사이트 웹서버 실행 중`);
});
