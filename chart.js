const fetch = require('node-fetch');
// const trackerBot = require('./bot')

function sendChart() {
    const chart = {
        type: 'bar',
        data: {
          labels: ['3 мая', '4 мая', '5 мая', '6 мая', '7 мая', '8 мая', '9 мая'],
          datasets: [{
            label: 'Медитация',
            data: [12, 10, 8, 10, 16, 15, 10]
          }]
        }
      }
    
    
    fetch("https://quickchart.io/chart/create", {
      body: JSON.stringify(chart),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    }).then(res => res.json()).then(json => {
        // trackerBot.sendMessage(140904466, json.url);
        return json.url;
    });
}

module.exports = sendChart;


