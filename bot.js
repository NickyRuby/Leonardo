const TelegramBot = require("node-telegram-bot-api");
// const sendChart = require('./chart');
const token = '1150544717:AAGgPlAinuqPlLzPHM41EweZO0_LdmXrDMo';
const sqlite = require("sqlite3");
const fetch = require("node-fetch");
const moment = require('moment');
// const db = new sqlite.Database(
//   process.env.HEROKU_DB || "./database.sqlite"
// );
const Pool = require('pg').Pool
const pool = new Pool({
  user: 'me',
  host: 'localhost',
  database: 'leonardo',
  password: 'password',
  port: 5432,
});

trackerBot = new TelegramBot(token, { polling: true });

trackerBot.onText(/\/start/, (msg) => {
  // console.log(msg);
  trackerBot.sendMessage(msg.chat.id, `
  Привет 🖖

Я помогу тебе фиксировать твои ежедневные активности (вроде медитации, сна, еды), и буду присылать еженедельные сводки по ним, чтобы можно было посмотреть на их трекшн и предпринять какие-то шаги по улучшению ситуации.

Например, сегодня ты спал не очень, и оцениваешь сон на 2 из 5. Тебе нужно выбрать «Сон» и поставить соответствующую оценку. В конце недели увидишь динамику оценок своего сна 📊

Выбери команду '/record' если хочешь записать значение и '/stats', чтобы посмотреть на общий результат. 

Давай начнем и все станет понятно 🙌
  `);
  pool.query(
    `
        SELECT * FROM Users WHERE user_id=${msg.from.id};`,
    (err, user) => {
      console.log(user.rows[0]);
      if (!user || user.rows[0] == undefined) {
        console.log("Creating new user...");
        pool.query(`
            INSERT INTO Users(user_id,chat_id)
            VALUES ('${msg.from.id}',${msg.chat.id}) RETURNING id;`,
          function (err,res) {
            if (err) {
              console.log(err);
            }
            console.log(res.rows[0]);
            pool.query(
              `SELECT * FROM Users WHERE id=${res.rows[0].id};`,
              (err, data) => {
                if (err) {
                  console.log(err);
                }
                console.log("User data");
                console.log(data.rows);
              }
            );
          }
        );
        let goals = [
          "Медитация",
          "Сон",
          "Настроение",
          "Рабочее время",
          "Тренировки",
        ];
        goals.forEach((goalName) => {
          createGoal(goalName, msg.from.id);
          createEntrie(goalName, 0, msg.from.id);
        });
      } else {
        console.log("User is alredy exist");
      }
    }
  );
});

trackerBot.onText(/\/record/, (msg) => {
  console.log(msg.chat.id);
  trackerBot.sendMessage(msg.chat.id, "Выбери что нужно затрекать", {
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

trackerBot.on("callback_query", (callbackData) => {
  let req = callbackData.data.split("_");
  let goalId;
  if (req[0] === "goal") {
    pool.query(`SELECT * FROM Goals WHERE name='${req[1]}';`, (err, data) => {
      if (err) {
        console.log(err);
      }
      console.log(data.rows);
      // TODO: Это можно снести, потому что мы изначально все создаем
      if (!data) {  
        createGoal(req[1], callbackData.message.chat.id);
      }
    });
    trackerBot.sendMessage(
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
    trackerBot.sendMessage(
      callbackData.message.chat.id,
      `
✅ Записал ${req[2]} в ${req[0]}. 
      
Выбирай /record для записи новой оценки, или /stats, чтобы посмотреть результат. `
    );
    // getStats(req[0],7,callbackData.message.chat.id);

  } else if (req[0] === 'stats') {
    trackerBot.sendMessage(
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
  } else if (req[1] ==='period') {
      console.log(`Period for stat is ${req[2]}`);
      getStats(req[0],req[2],callbackData.message.chat.id);
  }
});

function sendChart(id, activity,data, period) {
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
      trackerBot.sendPhoto(id, imageUrl, {
        caption: `Вот что получилось за ${period} дней 📈`,
      });
    });
}

function createGoal(goalName, userId) {
  // goal : name, name, user_id, range
  pool.query(`
    INSERT INTO Goals(name,user_id) 
    VALUES ('${goalName}', ${userId}) RETURNING id;`,
    function (err,data) {
      pool.query(`SELECT * FROM GOALS WHERE id=${data.rows[0].id};`, (err, data) => {
        if (err) {
          console.log(err);
        }
        console.log(data.rows);
      })
    });
}

function createEntrie(goalName, amount, userId) {
  pool.query(
    `SELECT * FROM Goals WHERE name='${goalName}' AND user_id=${userId};`,
    (err, data) => {
      console.log(data.rows);
      console.log(data.rows.length);
      if (data.rows.length === 0 || data.rows == undefined) {
        pool.query(`INSERT INTO Goals('${goalName}',${userId}) RETURNING id;`, function (err,data) {
          if (err) {
            console.log(err);
          }
          pool.query(
            `
        INSERT INTO Entries(goal_id,amount,date, user_id) 
        VALUES (${data.rows[0].id}, ${amount}, NOW(), ${userId}) RETURNING id;`,
            function (err,data) {
              if (err) {
                console.log(err);
              }
              pool.query(
                `SELECT * FROM Entries WHERE id=${data.rows[0].id};`,
                (err, data) => {
                  if (err) {
                    console.log(err);
                  }
                  console.log('Created entrie:');
                  console.log(data.rows);
                }
              );
            }
          );
        });
      } 
      pool.query(`
            INSERT INTO Entries(goal_id,amount,date,user_id) 
            VALUES (${data.rows[0].id}, ${amount}, NOW(), ${userId}) RETURNING id;`,
        function (err) {
          pool.query(
            console.log(data.rows)
            `SELECT * FROM Entries WHERE id=${data.rows[0].id};`,
            (err, data) => {
              if (err) {
                console.log(err);
              }
              console.log(data.rows);
            }
          );
        }
      );
    }
  );
}

function getStats(goal,period,userId) {
    let chartData = {dates: [], values: [] }
    for (let i = Number(period); i >= 0; i--) {
      let date = moment().subtract('days', Number(i)).format('YYYY-MM-DD');
      chartData.dates.push(date);
    }
      pool.query(`SELECT * FROM Goals WHERE name='${goal}' AND user_id=${userId};`, (err,data) => {
        if (err) {
            console.log(err);
        }
        console.log('heres goal data')
        console.log(data.rows);
        pool.query(`SELECT * FROM Entries WHERE user_id=${userId} AND goal_id=${data.rows[0].id}`, (err,data) => {
          if (err) {
              console.log(err);
          }
          console.log('heres all entries by goal data');
          console.log(data.rows);
        })
        pool.query(`SELECT * FROM Entries WHERE date <= NOW() AND date > NOW() - INTERVAL '-${period} DAYS'
        AND goal_id=${data.rows[0].id} AND user_id=${userId};`, (err,data) => {
            if (err) {
                console.log(err);
            }
            console.log(`heres all entries by goal by period of ${period} days`);
            console.log(data.rows);
            let dataFromDB = {dates: [], items: [] }
            data.rows.forEach(item => {
              dataFromDB.dates.push(item.date);
              dataFromDB.items.push({date: item.date, amount: item.amount})
            })
            chartData.dates.forEach(date => {
              if (dataFromDB.dates.includes(date)) {
                dataFromDB.items.forEach(item => {
                  if (item.date === date) {
                    chartData.values.push(item.amount)
                  }
                })
              } else {
                chartData.values.push(0);
              }
            })
            trackerBot.sendMessage(userId,`Вот результаты: `);
            sendChart(userId,goal,chartData,period);
            });
      })
}

trackerBot.onText(/\/stats/, (msg) => { 
    console.log(msg.chat.id);
    trackerBot.sendMessage(msg.chat.id, "Выбери что хочешь посчитать", {
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

trackerBot.on("polling_error", (err) => console.log(err));
