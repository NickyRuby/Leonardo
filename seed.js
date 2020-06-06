const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');

// db.run(`
//     CREATE TABLE IF NOT EXISTS Entries (
//         id INTEGER PRIMARY KEY,
//         goal_id INTEGER NOT NULL,
//         amount INTEGER NOT NULL,
//         date DATE NOT NULL,
//         user_id INTEGER NOT NULL,
//         FOREIGN KEY (goal_id) REFERENCES Goals(id),
//         FOREIGN KEY (user_id) REFERENCES Users(id)  
//     );
// `, function(err) {
//     if (err) {
//         console.log(err);
//     } else {
//         console.log('Table Entries created');
//     }
// });

// for (let i = 1; i < 150; i++) {
//     db.run(`
//         INSERT INTO Entries(goal_id,amount,date, user_id) 
//         VALUES ('${i}', ${i}, DATE('now','${i} day'), ${i});`, function(err) {
//         if (err) {
//             console.log(err);
//         }
//     });
// }


// db.all(`SELECT * FROM Entries`, (err,data) => {
//     console.log(data);
// })

// db.all(`SELECT * FROM Entries WHERE date < DATE('now','+5 days');`, (err,data) => {
//     if (err) {
//         console.log(err);
//         console.log(data.length);
//     }
//     console.log(data);
// })

db.all(`SELECT * FROM Entries WHERE user_id=140904466;`, (err,data) => {
    if (err) {
        console.log(err);
        console.log(data.length);
    }
    console.log(data);
})

// db.all
