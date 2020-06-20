const Pool = require('pg').Pool
const pool = new Pool({
  user: 'me',
  host: 'localhost',
  database: 'leonardo',
  password: 'password',
  port: 5432,
})

pool.query(`
    CREATE TABLE IF NOT EXISTS Users (
        user_id INTEGER PRIMARY KEY
    );
`,(err,res) => {
    if (err) {
        throw err;
    }
    console.log('Table Users Created');
});

pool.query(`
    CREATE TABLE IF NOT EXISTS Goals (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        range TEXT,
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
    );
`, (err,res) => {
    if (err) {
        throw err;
    }
    console.log('Table Goals Created');
});

pool.query(`
    CREATE TABLE IF NOT EXISTS Entries (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        date DATE NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (goal_id) REFERENCES Goals(id),
        FOREIGN KEY (user_id) REFERENCES Users(user_id)  
    );
`, (err,res) => {
    if (err) {
        throw err;
    }
    console.log('Table Entries Created');
});