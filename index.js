const Discord = require('discord.js');
const CoinbasePro = require('coinbase-pro');
const publicClient = new CoinbasePro.PublicClient();
const CronJob = require('cron').CronJob;
require('dotenv').config();

// Webhook link
const webhookURL = process.env.WEBHOOK;

let split = webhookURL.split('/');
let id = split[5];
let token = split[6];
const webhook = new Discord.WebhookClient(id, token);

let job = new CronJob(
  '0/5 * * * *',
  function () {
    monitor();
  },
  null,
  true,
  'America/New_York'
);
job.start();

// Cryptocurrency list
let cryptoArray = ['BTC-USD', 'ETH-USD', 'LTC-USD', 'LINK-USD'];

let monitor = async () => {
  const attachment = new Discord.MessageAttachment('./images/bitcoinLogo.png', 'bitcoinLogo.png');
  
  const embed = new Discord.MessageEmbed()
  .setColor('#070F15')
  .attachFiles(attachment)
  .setAuthor('Crypto Monitor', 'attachment://bitcoinLogo.png', 'https://pro.coinbase.com/trade/')
  .setTimestamp();
  
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
      .then(console.log('Webhook successfully sent\n'))
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
