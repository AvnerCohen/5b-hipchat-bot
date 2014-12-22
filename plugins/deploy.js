var request = require('request');

var projectMapping = {
                        'v2-test': 'fiverr_v2_frontend-tests',
                        'fin-stg1': 'fiverr_financials_staging01'
                        };
var jenkinsURL = 'http://#auth#@ci-dev.fiverrstaging.com/job/@PLACE_HOLDER@/build?delay=5sec';
var authData= process.env.JENKINS_AUTH;


exports.run = function (project, callback) {
  project.shift();
  if (project.length !== 0 && projectMapping[project]) {
    buildProject(project);
    return 'Started a build for: ' + project;
  } else {
    var response = "";
    Object.keys(projectMapping).forEach(function(key){
      response += key + '<br>';
    });
    return ('Available projects for build:<br>' + response);
  }
};

var headers = {
    'Content-Type': 'application/json'
  };

function buildProject(projName){
  var targetUrl = jenkinsURL.replace('@PLACE_HOLDER@', projectMapping[projName]).replace('#auth#', authData);
  request.post({
    headers: headers,
    url: targetUrl
    }, function(error, response, body) {
      if (error) { console.error(error); }
  });
}