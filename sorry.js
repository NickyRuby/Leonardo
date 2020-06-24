const leonardo = require('./bot').leonardo
const pool = require('./bot').pool;

pool.query('SELECT * FROM Users', (err,data)=> {
    if (err) {
        throw err;
    } 
    let message = `Извините за неполадки 🙈`;
    data.rows.forEach(user => {
        leonardo.sendMessage(user.user_id,message);
    })
});