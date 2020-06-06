const TelegramBot = require("node-telegram-bot-api");
// const sendChart = require('./chart');
const token = "1150544717:AAGgPlAinuqPlLzPHM41EweZO0_LdmXrDMo";
const sqlite = require("sqlite3");
const fetch = require("node-fetch");
// const sendChart, createGoal, createEntrie = require('./helpers');
const db = new sqlite.Database(
  process.env.TEST_DATABASE || "./database.sqlite"
);

trackerBot = new TelegramBot(token, { polling: true });

trackerBot.onText(/\/start/, (msg) => {
  // console.log(msg);
  trackerBot.sendMessage(msg.chat.id, `👋 Приветик, ${msg.from.first_name}!`);
  db.get(
    `
        SELECT * FROM Users WHERE user_id=${msg.from.id};`,
    (err, user) => {
      console.log(user);
      if (!user) {
        console.log("Creating new user...");
        db.run(
          `
            INSERT INTO Users(user_id,chat_id)
            VALUES ('${msg.from.id}',${msg.chat.id});`,
          function (err) {
            if (err) {
              console.log(err);
            }
            console.log(this.lastID);
            db.get(
              `SELECT * FROM Users WHERE id=${this.lastID};`,
              (err, data) => {
                if (err) {
                  console.log(err);
                }
                console.log("User data");
                console.log(data);
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
    db.get(`SELECT * FROM Goals WHERE name='${req[1]}';`, (err, data) => {
      if (err) {
        console.log(err);
      }
      console.log(data);
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
      `✅ Записал ${req[2]} в ${req[0]}`
    );
    getStats(req[0],7,callbackData.message.chat.id);

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

function sendChart(id, activity,data) {
  const chart = {
    format: "png",
    chart: {
      type: "bar",
      data: {
        labels: data.dates,
        datasets: [
          {
            label: `${activity} на этой неделе`,
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
        caption: `Вот что получилось за последнюю неделю 📈`,
      });
    });
}

function createGoal(goalName, userId) {
  // goal : name, name, user_id, range
  db.run(
    `
    INSERT INTO Goals(name,user_id) 
    VALUES ('${goalName}', ${userId});`,
    function (err) {
      db.get(`SELECT * FROM GOALS WHERE id=${this.lastID};`, (err, data) => {
        if (err) {
          console.log(err);
        }
        console.log(data);
      });
    }
  );
}

function createEntrie(goalName, amount, userId) {
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
        VALUES (${this.lastID}, ${amount}, DATE('now'), ${userId});`,
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
            VALUES (${data.id}, ${amount}, DATE('now'), ${userId});`,
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

function getStats(goal,period,userId) {
    db.serialize(() => {
      db.get(`SELECT * FROM Goals WHERE name='${goal}' AND user_id=${userId};`, (err,data) => {
        if (err) {
            console.log(err);
        }
        console.log('heres goal data')
        console.log(data);
        db.all(`SELECT * FROM Entries WHERE user_id=${userId} AND goal_id=${data.id}`, (err,data) => {
          if (err) {
              console.log(err);
          }
          console.log('heres all entries by goal data');
          console.log(data);
        })
        db.all(`SELECT * FROM Entries WHERE date <= DATE('now') AND date > DATE('now','-${period} days')
        AND goal_id=${data.id} AND user_id=${userId};`, (err,data) => {
            if (err) {
                console.log(err);
            }
            console.log(`heres all entries by goal by period of ${period} days`);
            console.log(data);
            let chartData = {dates: [], values: [] }
            data.forEach(item => {
              chartData.dates.push(item.date);
              chartData.values.push(item.amount);
              // dataForMessage += `${item.date}: ${item.amount},      `;
            })
            trackerBot.sendMessage(userId,`Вот результаты: `);
            sendChart(userId,goal,chartData);
            });
      })
    }) 
}

trackerBot.onText(/\/stats/, (msg) => {
    //   console.log(msg);
    //   trackerBot.sendMessage(msg.chat.id, `👋 Приветик, ${msg.from.first_name}!`);
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
