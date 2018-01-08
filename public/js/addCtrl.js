// Creates the addCtrl Module and Controller. Note that it depends on 'gservice' modules.
var addCtrl = angular.module('addCtrl', ['gservice']);
addCtrl.controller('addCtrl', function($scope, $http, $rootScope, gservice){

    // Initializes Variables
    // ----------------------------------------------------------------------------
    $scope.formData = {};
    var coords = {};
    var lat = 0;
    var long = 0;
    var numMarkers = 0;
    var markers = [];
    var fileData = " ";
    // Image used to represent markers
    var image = { url: './data/measle_blue.png' };
    
    // Read file data for trip start and end coordinates
    var txtFile = "../data/RN_Sea_trips.txt";
    // Using jQuery to go through the file
    $.ajax({
        async: false,
        url: txtFile,
        dataType: 'text',
        success: function (data) {
            fileData = fileData + data;
            // console.log(fileData);
        }
    });

    // Parse the string line by line 
    var dataLines = fileData.split("\n");
    // Ignore the first line, which contains the headers
    var len = dataLines.length;
    var startLat = [];
    var startLong = [];
    var endLat = [];
    var endLong = [];
    // startLat array contains the latitudes of all starting points etc.
    for (var i = 1; i < len; i++) {
        var linecoords = dataLines[i].split("\t");
        startLat.push(Number(linecoords[0]));
        startLong.push(Number(linecoords[1]));
        endLat.push(Number(linecoords[2]));
        endLong.push(Number(linecoords[3]));
    }

    // Set initial coordinates to the center of the US
    $scope.formData.longitude = -122.41996;
    $scope.formData.latitude = 47.435539;

    gservice.refresh($scope.formData.latitude, $scope.formData.longitude);

    // Functions
    // ----------------------------------------------------------------------------

    // Add logic to 
    //  --- display markers
    //  --- display trip when mouse hovers over the start point
    //  --- display the KML layer
    //  --- Display control elements to filter by region, overall number, dates, times etc.



});

