

function sendChart(id, activity) {
    const chart = {
      format: "png",
      chart: {
        type: "bar",
        data: {
          labels: [
            "17 мая",
            "18 мая",
            "19 мая",
            "20 мая",
            "21 мая",
            "22 мая",
            "23 мая",
          ],
          datasets: [
            {
              label: `${activity} на этой неделе`,
              data: [12, 10, 8, 10, 16, 15, 10],
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

module.exports = {sendChart, createGoal, createEntrie};