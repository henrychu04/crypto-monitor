# Discord Cryptocurrency Monitor

A simple cryptocurrency monitor that sends the price of specified cryptos every five minutes to a Discord webhook.

To use this monitor, first replace 'process.env.WEBHOOK' in index.js with a webhook link. The monitor will monitor all cryptos in cryptoArray in index.js, so feel free to add or remove any crypto tickers in that array.

## Install

```
npm install
```

## Run

```
npm start
```
