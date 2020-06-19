const moment = require('moment');
let period = '14';
let chartData = {dates: [], values: [] }
for (let i = 0; i < Number; i--) {
  let date = moment().subtract('days', Number(i)).format('YYYY-MM-DD');
  chartData.dates.push(date);
}
console.log(chartData);

for (let i = 14; i <= 0; i--) {
    console.log(i);
}