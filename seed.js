const createGoal = require('./bot').createGoal;
const createEntrie = require('./bot').createEntrie;
const pool = require('./bot').pool;


for (let i = 1; i < 50; i++) {
    let rand = Math.floor(Math.random() * 5) + 1;
    pool.query(`   
    INSERT INTO Entries(goal_id,amount,date,user_id) 
    VALUES (60, ${rand}, DATE(NOW() - INTERVAL '${i} DAYS'), 119821330) RETURNING *;`,
    function (err,data) {
        console.log("Новый энтри:");
        console.log(data.rows[0]);
    });
}

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

// db.all(`SELECT * FROM Entries WHERE user_id=140904466;`, (err,data) => {
//     if (err) {
//         console.log(err);
//         console.log(data.length);
//     }
//     console.log(data);
// })

// db.all
