const Discord = require('discord.js');
const CoinbasePro = require('coinbase-pro');
const publicClient = new CoinbasePro.PublicClient();
const QuickChart = require('quickchart-js');
const CronJob = require('cron').CronJob;
require('dotenv').config();
const attachment = new Discord.MessageAttachment('./images/bitcoinLogo.png', 'bitcoinLogo.png');

// Webhook link
const webhookURL = process.env.WEBHOOK;
const webhook = parseWebhook(webhookURL);

// Cryptocurrency options

/* Monitor rate options:
 *  1 minute: 60
 *  5 minutes: 300
 *  15 minutes: 900
 *  1 hour: 3600
 *  6 hours: 21600
 *  24 hours: 86400
 */

let monitorRate = 300;

// Up to 25 tickers, since the max amount of fields in a Discord embed is 25

let cryptoArray = ['BTC-USD', 'ETH-USD', 'LTC-USD', 'LINK-USD'];

// Can include the hourly chart of

let includeChart = true;
let cryptoChart = 'BTC-USD';

console.log(
  `Monitor started ...\nMonitor rate at ${monitorRateString(monitorRate)} ...\nMonitoring [${cryptoArray}] ...`
);
if (includeChart) console.log(`Charting ${cryptoChart} ...`);

let job = new CronJob(
  parseRate(monitorRate),
  function () {
    monitor();
  },
  null,
  true,
  'America/New_York'
);
job.start();

let monitor = async () => {
  const embed = new Discord.MessageEmbed()
    .setColor('#070F15')
    .attachFiles(attachment)
    .setAuthor('Crypto Monitor', 'attachment://bitcoinLogo.png', 'https://pro.coinbase.com/trade/')
    .setTimestamp();

  if (includeChart) {
    embed.setImage(await generateChart());
  }

  try {
    for (crypto of cryptoArray) {
      await publicClient
        .getProductTicker(crypto)
        .then((data) => {
          embed.addFields({
            name: crypto,
            value: `Price: $${(data.price / 1).toLocaleString()}\nVolume: ${(data.volume / 1).toLocaleString()}`,
            inline: true,
          });
        })
        .catch((error) => {
          console.log(error);
        });
    }

    await webhook
      .send(embed)
      .then(console.log('\nWebhook successfully sent'))
      .catch((err) => {
        if (err.message == 'Unknown Webhook') {
          throw new Error('Unknown webhook');
        } else if (err.message == 'Invalid Webhook Token') {
          throw new Error('Invalid webhook token');
        } else {
          throw new Error(err);
        }
      });
  } catch (err) {
    console.log(err);
  }
};

async function generateChart() {
  let data = {
    labels: [],
    datasets: [
      {
        label: cryptoChart,
        data: [],
        fill: false,
        borderColor: 'green',
        backgroundColor: 'transparent',
      },
    ],
  };

  let chartOptions = {
    legend: {
      display: true,
      position: 'top',
      labels: {
        padding: 1,
        boxWidth: 40,
        fontColor: 'black',
      },
    },
    scales: {
      yAxes: [
        {
          display: true,
          position: 'right',
          ticks: {
            fontColor: 'black',
          },
        },
      ],
      xAxes: [
        {
          display: true,
          position: 'bottom',
          ticks: {
            fontColor: 'black',
          },
        },
      ],
    },
    title: {
      display: true,
      fontColor: 'black',
      padding: 5,
      text: parseChartTitle(monitorRate),
    },
  };

  let historic = await publicClient.getProductHistoricRates(cryptoChart, { granularity: monitorRate });

  let open = 0;
  let close = 0;

  for (let i = 0; i < 12; i++) {
    let date = new Date(historic[i][0] * 1000);
    let hour = date.getHours();
    let min = date.getMinutes();

    let dateString = `${hour.toString().length == 1 ? '0' + hour : hour}:${
      min.toString().length == 1 ? '0' + min : min
    }:00`;
    data.labels = [dateString, ...data.labels];

    let average = (historic[i][3] + historic[i][4]) / 2;

    data.datasets[0].data = [average, ...data.datasets[0].data];

    if (i == 0) {
      open = historic[i][3];
    } else if (i == 11) {
      close = historic[i][4];
    }
  }

  if (open < close) {
    data.datasets[0].borderColor = 'red';
  }

  const myChart = new QuickChart();

  myChart.setConfig({
    type: 'line',
    data: data,
    options: chartOptions,
  });

  return myChart.getUrl();
}

function parseWebhook(webhookURL) {
  let split = webhookURL.split('/');
  let id = split[5];
  let token = split[6];
  return new Discord.WebhookClient(id, token);
}

function monitorRateString(monitorRate) {
  switch (monitorRate) {
    case 60:
      return '1 m';
    case 300:
      return '5 m';
    case 900:
      return '15 m';
    case 3600:
      return '1 h';
    case 21600:
      return '6 h';
    case 86400:
      return '1 d';
  }
}

function parseRate(monitorRate) {
  switch (monitorRate) {
    case 60:
      return '0/1 * * * *';
    case 300:
      return '0/5 * * * *';
    case 900:
      return '0/15 * * * *';
    case 3600:
      return '0 * * * *';
    case 21600:
      return '0 0/6 * * *';
    case 86400:
      return '0 0 * * *';
  }
}

function parseChartTitle(monitorRate) {
  switch (monitorRate) {
    case 60:
      return 'One Minute Chart';
    case 300:
      return 'Five Minute Chart';
    case 900:
      return '15 Minute Chart';
    case 3600:
      return 'Hourly Chart';
    case 21600:
      return 'Six Hour Chart';
    case 86400:
      return 'Daily Chart';
  }
}
