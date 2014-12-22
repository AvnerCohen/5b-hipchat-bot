exports.run = function (params) {
  params.shift();
  return 'Echo: ' + params.join('');
};
