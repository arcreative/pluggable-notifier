module.exports = {
  from: 'XBT BCH DASH EOS ETC ETH GNO ICN LTC MLN REP USDT XDG XLM XMR XRP ZEC'.split(' '),
    to: ['USD'],
  getUrl: function(from, to) {
  return 'https://api.kraken.com/0/public/Ticker?pair=' + from + to;
},
  responseParser: function(body) {
    body = JSON.parse(body);
    var results = body.result[Object.keys(body.result)[0]];
    return {
      price: Number(results.a[0]),
      high: Math.max.apply(null, results.h.map(Number)),
      low: Math.min.apply(null, results.l.map(Number))
    };
  }
};
