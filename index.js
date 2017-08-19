#!/usr/bin/env node

var fs = require('fs');
var Twilio = require('twilio');
var redis = require('redis');
var crypto = require('crypto');

// Load configuration
var config = require('./config.json');

// Clients
var redisClient = redis.createClient();
var twilioClient = new Twilio(config.twilio_account_id, config.twilio_account_token);

// Local modules
var getBlockchainPrice = require('./lib/get-blockchain-price');

// Defaults
const REDIS_PREFIX = config.redis_prefix || "notify";
const DEFAULT_CHECK_INTERVAL = config.check_interval || 1; // Minutes
const DEFAULT_NOTIFY_INTERVAL = config.notify_interval || 60; // Minutes

// Clear redis keys for all numbers
config.watchers.forEach(function(watcher) {

  // Process per-watcher numbers
  (watcher.notify_numbers || []).forEach(function(number) {
    redisClient.del(getRedisKey(number, watcher));
  });

  // Process general numbers for each watcher
  (config.notify_numbers || []).forEach(function(number) {
    redisClient.del(getRedisKey(number, watcher));
  });
});

// Iterate watchers
console.info('Starting watchers.');
config.watchers.forEach(function(watcher) {
  var runFn = getBlockchainPrice.bind(null, watcher.data.exchange, watcher.data.from, watcher.data.to, function(err, result) {
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
      (config.notify_numbers || []).concat(watcher.notify_numbers || []).forEach(function(watcher, number) {

        // Check if redis key exists for number
        redisClient.get(getRedisKey(number, watcher), function(err, reply) {
          if (err) throw err;

          // If key is found, don't re-notify
          if (reply) return;

          // Send message
          var precision = watcher.precision || 2;
          var message = watcher.data.from + '/' + watcher.data.to + ' price alert: ' + result.price.toFixed(precision) + ' ' + watcher.data.to + '!\n' +
              '\n' +
              'Price has just triggered your threshold of `' + watcher.condition + '`\n' +
              '\n' +
              'Current price: ' + result.price.toFixed(precision) + ' ' + watcher.data.to + '\n' +
              'Today\'s high: ' + result.high.toFixed(precision) + ' ' + watcher.data.to + '\n' +
              'Today\'s low: ' + result.low.toFixed(precision) + ' ' + watcher.data.to + '\n' +
              '\n' +
              (new Date().toLocaleString());
          twilioClient.messages.create({
              body: message,
              to: number,
              from: config.twilio_sms_number
            })
            .then(function(message) {
              console.info('Successfully sent watcher message to `' + number + '`.');

              // Remember not to contact again within interval
              var notifyInterval = (watcher.notify_interval || DEFAULT_NOTIFY_INTERVAL) * 60 - 1;
              redisClient.set(getRedisKey(number, watcher), '1', 'EX', notifyInterval, function (err) {
                if (err) console.error('Error setting redis key.');
              });
            }, function(err) {
              console.error('Error sending watcher message to `' + number + '`:' + (err || {}).message);
            });
        });
      }.bind(null, watcher));
    }
  });

  // Schedule runner
  if (!watcher.defer_first) runFn();
  setInterval(runFn, (watcher.check_interval || DEFAULT_CHECK_INTERVAL) * 60 * 1000);
});

// Utility functions
function getRedisKey(number, watcher) {
  var digest = crypto.createHash('md5').update([
        watcher.data.exchange,
        watcher.data.from,
        watcher.data.to,
        watcher.condition
      ].join('_')).digest('hex');
  return REDIS_PREFIX + ':ignore_notify:' + digest + ':' + number;
}
