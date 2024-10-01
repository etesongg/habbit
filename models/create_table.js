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

module.exports = {
  create_users_table,
  create_habits_table,
  create_records_table,
};
