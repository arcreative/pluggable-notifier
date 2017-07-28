var fs = require('fs');
var Twilio = require('twilio');
var redis = require('redis');

// Load configuration
var config = require('./config.json');

// Clients
var redisClient = redis.createClient();
var twilioClient = new Twilio(config.twilio_account_id, config.twilio_account_token);

// Local modules
var getBlockchainPrice = require('./lib/get-blockchain-price');

// Defaults
const REDIS_PREFIX = config.redis_prefix || "notify";
const DEFAULT_CHECK_INTERVAL = config.check_interval || 5; // Minutes
const DEFAULT_NOTIFY_INTERVAL = config.notify_interval || 60; // Minutes

// Clear redis keys for all numbers
config.notify_numbers.forEach(function(number) {
  redisClient.del(getRedisKey(number));
});

// Iterate watchers
console.info('Starting watchers.');
config.watchers.forEach(function(watcher) {
  var runFn = getBlockchainPrice.bind(null, watcher.exchange, watcher.from, watcher.to, function(err, result) {
    if (err) {
      if (typeof err === 'string') {
        throw err;
      } else {
        return console.error('Exchange query error:', err.originalError);
      }
    }

    // Check watcher condition
    if (eval(watcher.condition)) {

      // Notify all numbers
      config.notify_numbers.forEach(function(number) {

        // Check if redis key exists for number
        redisClient.get(getRedisKey(number), function(err, reply) {
          if (err) throw err;

          // If key is found, don't re-notify
          if (reply) return;

          // Send message
          var message = watcher.from + '/' + watcher.to + ' price alert: ' + result.price.toFixed(2) + ' ' + watcher.to + '!\n' +
              '\n' +
              'Price has just triggered your threshold of `' + watcher.condition + '`\n' +
              '\n' +
              'Current price: ' + result.price.toFixed(2) + ' ' + watcher.to + '\n' +
              'Today\'s high: ' + result.high.toFixed(2) + ' ' + watcher.to + '\n' +
              'Today\'s low: ' + result.low.toFixed(2) + ' ' + watcher.to;
          twilioClient.messages.create({
              body: message,
              to: number,
              from: config.twilio_sms_number
            })
            .then(function(message) {
              console.info('Successfully sent watcher message to `' + number + '`.');

              // Remember not to contact again within interval
              var notifyInterval = (watcher.notify_interval || DEFAULT_NOTIFY_INTERVAL) * 60 - 1;
              redisClient.set(getRedisKey(number), '1', 'EX', notifyInterval, function (err) {
                if (err) console.error('Error setting redis key.');
              });
            }, function(err) {
              console.error('Error sending watcher message to `' + number + '`:' + (err || {}).message);
            });
        });
      });
    }
  });

  // Schedule runner
  if (!watcher.defer_first) runFn();
  setInterval(runFn, (watcher.check_interval || DEFAULT_CHECK_INTERVAL) * 60 * 1000);
});

// Utility functions
function getRedisKey(number) {
  return REDIS_PREFIX + ':ignore_notify:' + number;
}
