var request = require('request');

const SUPPORTED_EXCHANGES = {
  kraken: require('./exchanges/kraken')
};

module.exports = function(exchangeName, from, to, callback) {
  var exchange = SUPPORTED_EXCHANGES[exchangeName];
  from = (from || '').toUpperCase();
  to = (to || '').toUpperCase();
  if (!exchange) {
    return callback('Unsupported exchange.  Supported exchanges are: `' + Object.keys(SUPPORTED_EXCHANGES).join('`, `') + '`.')
  } else if (exchange.from.indexOf(from) === -1) {
    return callback('Unsupported `from` currency.  Supported currencies are: `' + exchange.from.join('`, `') + '`.')
  } else if (exchange.to.indexOf(to) === -1) {
    return callback('Unsupported `to` currency.  Supported currencies are: `' + exchange.to.join('`, `') + '`.')
  }

  // Get the pricing from exchange
  request.get(exchange.getUrl(from, to), function(err, res, body) {
    if (err || res.statusCode !== 200) {
      var error = new Error('There was an error pulling pricing information from ' + exchangeName + ' API.');
      error.originalError = err;
      return callback(err);
    }

    callback(null, exchange.responseParser(body));
  });
};
