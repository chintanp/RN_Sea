angular.module('myApp').controller('loginController',
  ['$scope', '$location', 'AuthService',
    function ($scope, $location, AuthService) {

        $scope.login = function () {

            // initial values
            $scope.error = false;
            $scope.disabled = true;

            // call login from service
            AuthService.login($scope.loginForm.username, $scope.loginForm.password)
        // handle success
        .then(function () {
                $location.path('/');
                $scope.disabled = false;
                $scope.loginForm = {};
            })
        // handle error
        .catch(function () {
                $scope.error = true;
                $scope.errorMessage = "Invalid username and/or password";
                $scope.disabled = false;
                $scope.loginForm = {};
            });

        };

    }]);

angular.module('myApp').controller('logoutController',
  ['$scope', '$location', 'AuthService',
    function ($scope, $location, AuthService) {

        $scope.logout = function () {

            // call logout from service
            AuthService.logout()
        .then(function () {
                $location.path('/login');
            });

        };

    }]);

angular.module('myApp').controller('registerController',
  ['$scope', '$location', 'AuthService',
    function ($scope, $location, AuthService) {

        $scope.register = function () {

            // initial values
            $scope.error = false;
            $scope.disabled = true;

            // call register from service
            AuthService.register($scope.registerForm.username, $scope.registerForm.password)
        // handle success
        .then(function () {
                $location.path('/login');
                $scope.disabled = false;
                $scope.registerForm = {};
            })
        // handle error
        .catch(function () {
                $scope.error = true;
                $scope.errorMessage = "Something went wrong!";
                $scope.disabled = false;
                $scope.registerForm = {};
            });

        };

    }]);


// Controller to take care of sending the simulation data and sending it to the server
angular.module('myApp').controller('homeController',
  ['$scope', '$location', '$q', '$http', 'AuthService', 'Upload', 'FileSaver', 'Blob', '$window', '$timeout',
    function ($scope, $location, $q, $http, AuthService, Upload, FileSaver, Blob, $window, $timeout) {
        $scope.resultStatus = '';
        $scope.pageHeader = 'Input Panel';
        $scope.supportingTextHeader = 'Upload parameter and frequency files or default values will be used, and then press solve.';
        $scope.showCurrent = false;
        $scope.showTime = false;
        $scope.showCycle = false;
        $scope.showFormButtons = false;
        $scope.simulation = "";
        $scope.simulation.current = "";
        $scope.simulation.time = "";
        $scope.showGraph = false;
        $scope.showGraphButtons = false;
        $scope.showResultStatus = false;
        $scope.graph = { showGraphCard : false };
        $scope.showPlot = false;
        $scope.parameterState = "Select Parameter file to upload";
        $scope.frequencyState = "Select Frequency file to upload";
        $scope.parFilePath = null;
        $scope.freqFilePath = null;

        $scope.showCharts = false;
        $scope.actionText = "Show EIS";
        $scope.graphData = [];



        $scope.eisView = function () {
            $scope.pageHeader = 'Input Panel';
            $scope.showCurrent = true;
            $scope.showTime = true;
            $scope.showCycle = false;
            $scope.showFormButtons = true;
            $scope.actionText = "Charge";
            $scope.btn = $scope.buttons[0];
            $scope.showCharts = true;
            $scope.graph.showGraphCard = false;
            $scope.showPlot = false;
        };



        $scope.eis = function () {
            // send the charge current and charge time to the server and call appropriate function
            // alert("Charging");
            // create a new instance of deferred

            $scope.graph.showGraphCard = false;
            $scope.graphData = [];
            $scope.showPlot = false;

            if($scope.parFilePath) {
                var parameterFileName = $scope.parFilePath;
            } else {
                var parameterFileName = 'uploads/default/' + 'pars.txt';
            }

            if($scope.freqFilePath) {
                var frequencyFileName = $scope.freqFilePath;
            } else {
                var frequencyFileName = 'uploads/default/' + 'freqs.txt';
            }


            var deferred = $q.defer();

            // send a post request to the server
            $http.post('/user/chargeSolution',
                { parFileName: parameterFileName, freqFileName: frequencyFileName })
                // handle success
                .success(function (data, status) {
                if (status === 200) {

                    $scope.graph.showGraphCard = true;
                    $scope.showResultStatus = true;
                    $scope.resultStatus = "Model Solved!";
                    $scope.showCharts = true;
                    $scope.graphData = { imgImpedance: [],
                        realImpedance: [] };
                    $scope.showPlot = true;
                    //$scope.actionText = "Download Data";

                    $scope.options = { showLink: false, displayLogo: false };

                    var imgImpedance = [];
                    var realImpedance = [];
                    var plotData = [];
                    //$scope.colors = ['#45b7cd', '#ff6384', '#ff8e72'];

                    imgImpedance = data.imgImpedance;
                    realImpedance = data.realImpedance;

                    $scope.graphData.imgImpedance = imgImpedance;
                    $scope.graphData.realImpedance = realImpedance;

                    for (i = 0; i < imgImpedance.length; i++) {
                        plotData.push({x :  realImpedance[i], y : imgImpedance[i]});
                    }


                    user = true;


                    setTimeout(function() {
                        timeChart('plot-eis', plotData, 'Linear Impedance', 'Img Imp.');
                    }, 0);


                    deferred.resolve();

                } else {
                    user = false;
                    deferred.reject();
                }
            })
            // handle error
            .error(function (data) {
                user = false;
                deferred.reject();
            });

            // return promise object
            return deferred.promise;
        };


        $scope.uploadParameterFile = function(file, errFiles) {
            $scope.parsf = file;
            $scope.errFile = errFiles && errFiles[0];
            if (file) {
                file.upload = Upload.upload({
                    url:'http://localhost:3000/uploadParameterFile',
                    data: {file: file}
                });

                file.upload.then(function(response) {
                    $timeout(function() {
                        file.result = response.data;
                        $scope.parFilePath = response.data.path;
                    });
                }, function(response) {
                    if(response.status > 0)
                        $scope.errorMsg = response.status + ": " + response.data;
                }, function(evt) {
                    file.progress = Math.min(100, parseInt(100.0*
                                              evt.loaded / evt.total));
                    if(file.progress == 100)
                        $scope.parameterState = $scope.parsf.name + " uploaded";


                });
            }
        };

        $scope.uploadFrequencyFile = function(file, errFiles) {
            $scope.freqsf = file;
            $scope.errFile = errFiles && errFiles[0];
            if (file) {
                file.upload = Upload.upload({
                    url:'http://localhost:3000/uploadFrequencyFile',
                    data: {file: file}
                });

                file.upload.then(function(response) {
                    $timeout(function() {
                        file.result = response.data;
                        $scope.freqFilePath = response.data.path;
                    });
                }, function(response) {
                    if(response.status > 0)
                        $scope.errorMsg = response.status + ": " + response.data;
                }, function(evt) {
                    file.progress = Math.min(100, parseInt(100.0*
                        evt.loaded / evt.total));
                    if(file.progress == 100)
                        $scope.frequencyState = $scope.freqsf.name + " uploaded";


                });
            }
        };

        $scope.downloadData = function() {

            var blobLine = [];
            for (var i = 0; i < $scope.graphData.imgImpedance.length; i++) {
                blobLine.push($scope.graphData.imgImpedance[i] + "\t" + $scope.graphData.realImpedance[i] + "\n");
            }
            var eisData = new Blob(blobLine);
            FileSaver.saveAs(eisData, "eis.txt");
        };

    }]);
