const sqlite = require("sqlite3");
const db = new sqlite.Database(process.env.TEST_DATABASE || "./database.sqlite");

function createEntrie(goalName, amount, userId,period) {
    db.get(
      `SELECT * FROM Goals WHERE name='${goalName}' AND user_id=${userId};`,
      (err, data) => {
        if (!data) {
          db.run(`INSERT INTO Goals('${goalName}',${userId});`, function (err) {
            if (err) {
              console.log(err);
            }
            db.run(
              `
          INSERT INTO Entries(goal_id,amount,date, user_id) 
          VALUES (${this.lastID}, ${amount}, DATE('now', '-${period} days'), ${userId});`,
              function (err) {
                if (err) {
                  console.log(err);
                }
                db.get(
                  `SELECT * FROM Entries WHERE id=${this.lastID};`,
                  (err, data) => {
                    if (err) {
                      console.log(err);
                    }
                    console.log('Created entrie:');
                    console.log(data);
                  }
                );
              }
            );
          });
        }
        db.run(
          `
              INSERT INTO Entries(goal_id,amount,date, user_id) 
              VALUES (${data.id}, ${amount}, DATE('now', '-${period} days'), ${userId});`,
          function (err) {
            db.get(
              `SELECT * FROM Entries WHERE id=${this.lastID};`,
              (err, data) => {
                if (err) {
                  console.log(err);
                }
                console.log(data);
              }
            );
          }
        );
      }
    );
  }

// for (let i=0; i < 5; i++) {
//     let mark = Math.floor(Math.random() * Math.floor(5))
//     createEntrie('Медитация', mark, 119821330,i);
// }

// db.all(`SELECT date FROM Entries WHERE user_id=119821330 AND goal_id=4`, (err,data) => {
//     if (err) {
//         console.log(err);
//     }
//     console.log('heres the data');
//     console.log(data);
// })


// db.all(`SELECT * FROM Entries WHERE date <= DATE('now') AND date > DATE('now','-14 days')
//       AND goal_id=4 AND user_id=140904466;`, (err,data) => {
//           if (err) {
//               console.log(err);
//           }
//           console.log(data);
// });



// db.all(`SELECT * FROM Entries;`, (err,data) => {
//     if (err) {
//         console.log(err);
//     }
//     console.log('heres the data');
//     console.log(data);
// })