const leonardo = require('./bot').leonardo;
const pool = require('./bot').pool;

pool.query('SELECT * FROM Users WHERE user_id=119821330', (err,data)=> {
    if (err) {
        throw err;
    } 
    // console.log(data.rows)
    let message = `Как день? Нажимай /record, чтобы записать результаты 🚀`;
    data.rows.forEach(user => {
        console.log('')
        leonardo.sendMessage(user.user_id,message);
    })
});