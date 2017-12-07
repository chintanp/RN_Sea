var express = require('express');
var router = express.Router();
var passport = require('passport');
var execFile = require('child_process').execFile;
var execFileSync = require('child_process').execFileSync;
var spawn = require('child_process').spawn;
var fs = require('fs');
var readline = require('readline');
var stream = require('stream');

var User = require('../models/user.js');

router.post('/register', function(req, res) {
  User.register(new User({ username: req.body.username }),
    req.body.password, function(err, account) {
    if (err) {
      return res.status(500).json({
        err: err
      });
    }
    passport.authenticate('local')(req, res, function () {
      return res.status(200).json({
        status: 'Registration successful!'
      });
    });
  });
});

router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({
        err: info
      });
    }
    req.logIn(user, function(err) {
      if (err) {
        return res.status(500).json({
          err: 'Could not log in user'
        });
      }
      res.status(200).json({
        status: 'Login successful!'
      });
    });
  })(req, res, next);
});

// Perform action upon call to charge
router.post('/chargeSolution', function (req, res) {
    console.log("Got from browser for charging - " + "current: " + req.body.current + "time : " + req.body.time);

/*    //  Pass the current and time values to the exe and perform charge
    var current = req.body.current || 1;
    var time = req.body.time || 1800;*/
    var parameterFileName = req.body.parFileName || 'pars.txt';
    var frequencyFileName = req.body.freqFileName || 'freqs.txt';

    var chargeSimulation = function (parameterFileName, frequencyFileName) {
        //console.log("Starting exe");
        //console.log(__dirname);
	    var serverPath = __dirname.slice(0, -6);
	    var homePath = serverPath.slice(0, -7);
	    //console.log("Homepath", homePath);
        var cmd = 'linear-impedance-solver';
        var cwd = homePath + 'results/';
        var parFilePath = homePath + parameterFileName;
        var freqFilePath = homePath + frequencyFileName;
        var impedanceFilePath = homePath + 'results/impedance.txt';
        var imps = [];
        var realImpedance = [];
        var imgImpedance = [];
        var line_count = 0;

        try {
	        var output = execFileSync(cmd, [parFilePath, freqFilePath], {cwd : cwd}).toString();
	        //console.log("output of the simulation -------------------------------" + "\n\n" + output);
        }

        catch (er) {
          console.log("There was an error " + er.file + er.pid + er.status);
          process.exit(1);
        }
        // Extract results

        fs.readFileSync(impedanceFilePath).toString().split("\n").forEach(function (imp_line) {
            if (imp_line) {
                imps = imp_line.split('\t');
                realImpedance.push(imps[0]);
                imgImpedance.push(imps[1]);
            }
        });

        var result_data = {};

       result_data['realImpedance'] = realImpedance;
       result_data['imgImpedance'] = imgImpedance;
        // send the data to the client
        res.status(200).json(result_data);

     /*   // Extract scaleparams into an array

        var arr_scale = [];

	      fs.readFileSync(scaleparam_path).toString().split("\n").forEach(function (scale_line) {
            //console.log("Reading scaleparams :" +  scale_line);
            arr_scale.push(scale_line);
            scale_count = scale_count + 1;
            if (scale_count == 33) {
                //console.log("Read all the scale params");

                // Extract data into an array

                var arr_data = [];

	              fs.readFileSync(data_path).toString().split("\n").forEach(function (data_line) {
                    //console.log("Reading data :" + data_line)
                    arr_data.push(data_line);
                    data_count = data_count + 1;
                    if (data_count == 32 * node_points + 1) {
                        //console.log("Read all the data");

                        var result_data = [];

                        // parse the data array to get relevant results
                        for (var i = 1; i <= node_points; i++) {
                            result_data.push({
                                timeVal : i * time / node_points,
                                tempVal : arr_scale[index_temp] * arr_data[i + node_points * (index_temp) - 1],
                                fadeVal : -1 * arr_scale[index_fade] * arr_data[i + node_points * (index_fade) - 1],
                                voltageVal : arr_scale[index_voltage] * arr_data[i + node_points * (index_voltage) - 1],
                                currentVal : arr_scale[index_current] * arr_data[i + node_points * (index_current) - 1],
                                socVal : ((100 * arr_scale[index_soc] * arr_data[i + node_points * (index_soc) - 1]) / 30555 - 0.259)/(0.99 - 0.259)    // soc calculation is subjective to battery parameters
                            });
                        }

                        // send the data to the client
                        res.status(200).json(result_data);

                        }
                    });
                }
            });*/
          }

          // TODO: Handle connection timeouts and other reasons that can cause server crash
    chargeSimulation(parameterFileName, frequencyFileName);
});

// Perform action upon call to discharge
router.post('/dischargeSolution', function (req, res) {
    console.log("Got from browser for discharging - " + "current: " + req.body.current );

    //  Pass the current and time values to the exe and perform discharge
});

router.get('/logout', function(req, res) {
  req.logout();
  res.status(200).json({
    status: 'Bye!'
  });
});

router.get('/status', function(req, res) {
  if (!req.isAuthenticated()) {
    return res.status(200).json({
      status: false
    });
  }
  res.status(200).json({
    status: true
  });
});


module.exports = router;
