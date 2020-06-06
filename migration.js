const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');

db.run(`
    CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY,
        user_id INTEGER NOT NULL,
        chat_id INTEGER NOT NULL
    );
`, function(err) {
    if (err) {
        console.log(err);
    } else {
        console.log('Table Users created');
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS Goals (
        id INTEGER PRIMARY KEY,
        name INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        range TEXT,
        FOREIGN KEY (user_id) REFERENCES Users(id)
    );
`, function(err) {
    if (err) {
        console.log(err);
    } else {
        console.log('Table Goals created');
    }
});

db.run(`
    CREATE TABLE IF NOT EXISTS Entries (
        id INTEGER PRIMARY KEY,
        goal_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        date DATE NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (goal_id) REFERENCES Goals(id),
        FOREIGN KEY (user_id) REFERENCES Users(id)  
    );
`, function(err) {
    if (err) {
        console.log(err);
    } else {
        console.log('Table Entries created');
    }
});