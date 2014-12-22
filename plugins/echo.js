exports.run = function (params) {
  params.shift();
  return 'echo: ' + params.join('');
};
