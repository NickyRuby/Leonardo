const sqlite = require('sqlite3');
const db = new sqlite.Database(process.env.TEST_DATABASE || './database.sqlite');

// db.run('DELETE FROM Entries WHERE goal_id=9 AND user_id=119821330;', (err) => {
//     console.log('Entries deleted');
// })

