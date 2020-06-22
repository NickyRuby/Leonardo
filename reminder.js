// const sendMessage = require("node-telegram-bot-api").sendMessage;
// const pool = require('./bot').pool;

pool.query('SELECT * FROM Users', (err,data)=> {
    if (err) {
        throw err;
    } 
    let message = `Как день? Нажимай /record, чтобы записать результаты 🚀`;
    data.rows.forEach(user => {
        leonardo.sendMessage(user.user_id,message);
    })
});