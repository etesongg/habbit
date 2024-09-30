create table users(
    id integer primary key autoincrement,
    name varchar,
    email varchar unique,
    password varchar,
    createAt datetime default currnet_timestamp
)

create table habits (
    id integer primary key autoincrement,
    habit_name varchar,
    start_date datetime,
    end_date datetime,
    createAt datetime default currnet_timestamp,
    user_id integer not null,
    foreign key(user_id) references users(id)
)

create table records (
    id integer primary key autoincrement,
    memo varchar,
    createAt datetime default currnet_timestamp,
    habit_id integer not null,
    foreign key(habit_id) references habits(id)
)



