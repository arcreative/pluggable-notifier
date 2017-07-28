# pluggable-notifier

Experiment to cause periodic SMS notifications based on one or more pluggable actions

## Supported plugs (not completely abstracted yet)

* Blockchain price

## Configuration

See `./config.json.example` (or copy to `config.json`) and edit to your liking.

```json
{
  "twilio_account_id": "<YOUR_ACCOUNT_ID>",
  "twilio_account_token": "<YOUR_ACCOUNT_TOKEN>",
  "twilio_sms_number": "+17075551111", // Number to send from
  "notify_numbers": ["+17075559999"],
  "check_interval": null, // In minutes
  "notify_interval": null, // In minutes
  "redis_prefix": null, // Optional redis prefix
  "watchers": [
    {
      "exchange": "kraken",
      "from": "ETH",
      "to": "USD",
      "condition": "result.price < 220", // Eval'd to determine whether to send notification--truthy values will send
      "check_interval": null, // In minutes, overrides main check_interval
      "notify_interval": null, // In minutes, overrides main notify_interval
      "defer_first": false
    }
  ]
}
```

## Disclaimer

You probably shouldn't use this :-)