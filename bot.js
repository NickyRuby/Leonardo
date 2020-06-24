const TelegramBot = require("node-telegram-bot-api");
require('dotenv').config();
const fetch = require("node-fetch");
const moment = require("moment");
require('https').createServer().listen(process.env.PORT || 5000).on('request', function(req, res){
  res.end('')
});
let greetings = ['Йоу!','Ну как оно?','Че как?','Время пришло!','Не забыл?','Давай-давай','Как день?'];


const Pool = require("pg").Pool;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

leonardo = new TelegramBot(process.env.TOKEN, { polling: true });

leonardo.onText(/\/start/, (msg) => {
  // console.log(msg);
  leonardo.sendMessage(
    msg.chat.id,
    `
  Привет 🖖

Я помогу тебе фиксировать твои ежедневные активности (вроде медитации, сна, еды), и буду присылать еженедельные сводки по ним, чтобы можно было посмотреть на их трекшн и предпринять какие-то шаги по улучшению ситуации.

Например, сегодня ты спал не очень, и оцениваешь сон на 2 из 5. Тебе нужно выбрать «Сон» и поставить соответствующую оценку. В конце недели увидишь динамику оценок своего сна 📊

Выбери команду '/record' если хочешь записать значение и '/stats', чтобы посмотреть на общий результат. 

Давай начнем и все станет понятно 🙌
  `
  );
  pool.query(
    `
        SELECT * FROM Users WHERE user_id=${msg.from.id};`,
    (err, user) => {
      console.log(user.rows[0]);
      if (user.rows[0] == undefined) {
        console.log("Creating new user...");
        pool.query(
          `
            INSERT INTO Users(user_id)
            VALUES ('${msg.from.id}') RETURNING user_id;`,
          function (err, res) {
            if (err) {
              console.log(err);
            }
            console.log(res.rows);
            pool.query(
              `SELECT * FROM Users WHERE user_id=${res.rows[0].user_id};`,
              (err, data) => {
                if (err) {
                  console.log(err);
                }
                console.log("User data");
                console.log(data.rows);
                let goals = [
                  "Медитация",
                  "Сон",
                  "Настроение",
                  "Рабочее время",
                  "Тренировки",
                ];
                goals.forEach((goalName) => {
                  createGoal(goalName, msg.from.id);
                });
              });
          }
        );
      } else {
        console.log("User is alredy exist");
      }
    }
  );
});

leonardo.onText(/\/record/, (msg) => {
  console.log(msg.chat.id);
  leonardo.sendMessage(msg.chat.id, "Выбери что нужно затрекать", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🧘🏻‍♂️ Медитацию", callback_data: "goal_Медитация" }],
        [{ text: "😴 Сон", callback_data: "goal_Сон" }],
        [{ text: "👀 Настроение", callback_data: "goal_Настроение" }],
        [{ text: "👨🏻‍💻 Рабочее время", callback_data: "goal_Рабочее время" }],
        [{ text: "🤸‍♂️ Тренировки", callback_data: "goal_Тренировки" }],
      ],
    },
  });
});

leonardo.on("callback_query", (callbackData) => {
  let req = callbackData.data.split("_");
  if (req[0] === "goal") {
    pool.query(`SELECT * FROM Goals WHERE name='${req[1]}';`, (err, data) => {
      if (err) {
        console.log(err);
      }
      console.log("Это то что мы у нас есть в базе по этой цели:");
      console.log(data.rows);
    });
    leonardo.sendMessage(
      callbackData.message.chat.id,
      `${req[1]}, принято. Как прошло?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "1", callback_data: `${req[1]}_mark_1` },
              { text: "2", callback_data: `${req[1]}_mark_2` },
              { text: "3", callback_data: `${req[1]}_mark_3` },
              { text: "4", callback_data: `${req[1]}_mark_4` },
              { text: "5", callback_data: `${req[1]}_mark_5` },
            ],
          ],
        },
      }
    );
  } else if (req[1] === "mark") {
    createEntrie(req[0], req[2], callbackData.message.chat.id);
    leonardo.sendMessage(
      callbackData.message.chat.id,
      `
✅ Записал ${req[2]} в ${req[0]}. 
      
Выбирай /record для записи новой оценки, или /stats, чтобы посмотреть результат. `
    );
  } else if (req[0] === "stats") {
    leonardo.sendMessage(
      callbackData.message.chat.id,
      `${req[1]}, принято. За какой период?`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: "Текущая неделя", callback_data: `${req[1]}_period_7` },
              { text: "14 дней", callback_data: `${req[1]}_period_14` },
              { text: "30 дней", callback_data: `${req[1]}_period_30` },
            ],
          ],
        },
      }
    );
  } else if (req[1] === "period") {
    console.log(`Period for stat is ${req[2]}`);
    getStats(req[0], req[2], callbackData.message.chat.id);
  }
});

function sendChart(id, activity, data, period) {
  const chart = {
    format: "png",
    chart: {
      type: "bar",
      data: {
        labels: data.dates,
        datasets: [
          {
            label: `${activity} за ${period} дней`,
            data: data.values,
          },
        ],
      },
    },
  };

  fetch("https://quickchart.io/chart/create", {
    body: JSON.stringify(chart),
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })
    .then((res) => res.json())
    .then((json) => {
      let imageUrl = json.url;
      console.log(imageUrl);
      leonardo.sendPhoto(id, imageUrl, {
        caption: `Вот что получилось за ${period} дней 📈`,
      });
    });
}

function createGoal(goalName, userId) {
  console.log(goalName);
  pool.query(`SELECT * FROM Goals WHERE name='${goalName}'
  AND user_id=${userId};`,(err,data) => {
    console.log(data.rows);
    if (data.rows.length === 0) {
        pool.query(`
        INSERT INTO Goals(name,user_id) 
        VALUES ('${goalName}', ${userId}) RETURNING id;`,
        function (err, data) {
          pool.query(
            `SELECT * FROM GOALS WHERE id=${data.rows[0].id};`,
            (err, data) => {
              if (err) {
                console.log(err);
              }
              console.log(data.rows);
              return data.rows[0].id;
            }
          );
        }
      );
    } else {
      console.log('Цель уже есть')
      return false;
    }
  })
}

// TODO: Make Create Goal Function
function createEntrie(goalName, amount, userId) {
  let goalId;
  // TODO: Добавить проверку на то существует ли уже коммит
  pool.query(
    `SELECT * FROM Goals WHERE name='${goalName}' AND user_id=${userId};`,
    (err, data) => {
        // проверяем есть ли уже энтри 
        goalId = data.rows[0].id;
        pool.query(
          `SELECT * FROM Entries WHERE goal_id=${goalId}
          AND user_id=${userId} AND date= DATE(NOW());`,
          (err, data) => {
            if (err) {
              console.log(err);
            }
            console.log(data.rows);
            if (data.rows.length === 0) {
                  pool.query(`   
                  INSERT INTO Entries(goal_id,amount,date,user_id) 
                  VALUES (${goalId}, ${amount}, NOW(), ${userId}) RETURNING *;`,
                    function (err,data) {
                      console.log("Новый энтри:");
                      console.log(data.rows[0]);
                    });
            } else {
              pool.query(
                `UPDATE Entries 
                SET amount=${amount} 
                WHERE goal_id=${goalId}
                AND user_id=${userId} AND date= DATE(NOW()) RETURNING *;`,
                (err, data) => {  
                  console.log('Обновили энтри');
                  console.log(data.rows[0]);
                });
            }
            // cоздаем энтри
          });
    });
}

function getStats(goal, period, userId) {
  let numPeriod = Number(period) - 1;
  let chartData = { dates: [], values: [] };
  for (let i = numPeriod; i >= 0; i--) {
    let date = moment().subtract("days", i).format("YYYY-MM-DD");
    chartData.dates.push(date);
  }
  console.log(chartData);
  pool.query(
    `SELECT * FROM Goals WHERE name='${goal}' AND user_id=${userId};`,
    (err, data) => {
      if (err) {
        console.log(err);
      }
      console.log("heres goal data");
      console.log(data.rows);
      pool.query(
        `SELECT * FROM Entries WHERE user_id=${userId} AND goal_id=${data.rows[0].id}`,
        (err, data) => {
          if (err) {
            console.log(err);
          }
          console.log("heres all entries by goal data");
          console.log(data.rows);
        }
      );
      pool.query(
        `SELECT * FROM Entries WHERE (date <= DATE(NOW()) AND date > DATE(NOW() - INTERVAL '${numPeriod} DAYS'))
        AND goal_id=${data.rows[0].id} AND user_id=${userId};`,
        (err, data) => {
          if (err) {
            console.log(err);
          }
          console.log(`heres all entries by goal by period of ${period} days`);
          console.log(data.rows);
          let dataFromDB = { dates: [], items: [] };
          data.rows.forEach((item) => {
            let humanDate = moment(item.date).format("YYYY-MM-DD");
            dataFromDB.dates.push(humanDate);
            dataFromDB.items.push({ date: humanDate, amount: item.amount });
          });
          console.log('То что получили из БД');
          console.log(dataFromDB);
          chartData.dates.forEach((date) => {
            if (dataFromDB.dates.includes(date)) {
              dataFromDB.items.forEach((item) => {
                if (item.date === date) {
                  chartData.values.push(item.amount);
                }
              });
            } else {
              chartData.values.push(0);
            }
          });
          console.log(chartData);
          sendChart(userId, goal, chartData, period);
        }
      );
    }
  );
}

leonardo.onText(/\/stats/, (msg) => {
  console.log(msg.chat.id);
  leonardo.sendMessage(msg.chat.id, "Выбери что хочешь посчитать", {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🧘🏻‍♂️ Медитацию", callback_data: "stats_Медитация" }],
        [{ text: "😴 Сон", callback_data: "stats_Сон" }],
        [{ text: "👀 Настроение", callback_data: "stats_Настроение" }],
        [{ text: "👨🏻‍💻 Рабочее время", callback_data: "stats_Рабочее время" }],
        [{ text: "🤸‍♂️ Тренировки", callback_data: "stats_Тренировки" }],
      ],
    },
  });
});

function sendReminders() {  
  
  let h = new Date().getHours();
  let m =  new Date().getMinutes();
  let s = new Date().getSeconds();

  if (h == 19 && m == 50 && s == 0) {

    pool.query('SELECT * FROM Users', (err,data)=> {
      if (err) {
          throw err;
      } 
      let yo = greetings[Math.floor(Math.random() * Math.floor(8))]
      let message = `${yo} Нажимай /record, чтобы записать результаты 🚀. Вчера забыл напомнить, сорян`;
      data.rows.forEach(user => {
          leonardo.sendMessage(user.user_id,message);
      });
      console.log(`Отправил напоминания ${data.rows.length} пользователям`);
    });
  }
}

setInterval(sendReminders, 1000); 

leonardo.on("polling_error", (err) => console.log(err));

module.exports = {createGoal,createEntrie, pool, leonardo}