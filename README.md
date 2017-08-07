# pluggable-notifier

Experiment to cause periodic SMS notifications based on one or more pluggable actions

## Supported plugs (not completely abstracted yet)

* Blockchain price

## Installation / getting started

Make sure you have redis installed, then run the following:

```sh
git clone git@github.com:arcreative/plugable-notifier.git
cd pluggable-notifier
npm install
cp config.json.example config.json # Don't forget to edit your values and remove comments!
```

To run, just run `npm start`.

## Persistence/daemonizing

The easiest way to do this is probably by using the following (a la PM2):

```sh
npm install -g pm2 # Installs PM2
pm2 startup # Adds upstart/systemd script to start PM2 on system startup
pm2 start index.js --name pluggable-notifier --watch # Adds the script as a PM2 service
pm2 save # Saves snapshot of running services
```

System restarts will trigger a restart of the service.  Likewise, changes to your 
`config.json` file will trigger a restart.  If you don't want this, just remove the
`--watch` parameter when creating the service.

More features:
* Service can be stopped with `pm2 stop pluggable-notifier`
* Service can be restarted with `pm2 restart pluggable-notifier`
* Service can be removed with `pm2 delete pluggable-notifier`
* Service can be disabled by getting `pm2 status` where you want it and using `pm2 save`

## Configuration

See `./config.json.example` (or copy to `config.json`) and edit to your liking.

```js
{
  "twilio_account_id": "<YOUR_ACCOUNT_ID>",
  "twilio_account_token": "<YOUR_ACCOUNT_TOKEN>",
  "twilio_sms_number": "+17075551111", // Number to send from
  "notify_numbers": ["+17075559999"], // Notifies this number for any watcher
  "check_interval": null, // In minutes
  "notify_interval": null, // In minutes
  "redis_prefix": null, // Optional redis prefix
  "watchers": [
    {
      "data": {
        "exchange": "kraken",
        "from": "ETH",
        "to": "USD"
      },
      "condition": "result.price < 220", // Eval'd to determine whether to send notification--truthy values will send
      "notify_numbers": ["+17071231234"], // Notifies these numbers ONLY for this watcher
      "check_interval": null, // In minutes, overrides main check_interval
      "notify_interval": null, // In minutes, overrides main notify_interval
      "defer_first": false
    }
  ]
}
```

## Disclaimer

You probably shouldn't use this :-)