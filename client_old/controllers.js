// **** All the controllers can be found here ****//

// Handles the login function
angular.module('myApp').controller('loginController', ['$scope', '$location', 'AuthService', function ($scope, $location, AuthService) {

    $scope.login = function () {

        // initial values
        $scope.error = false;
        $scope.disabled = true;

        // call login from service
        AuthService.login($scope.loginForm.username, $scope.loginForm.password)// handle success
            .then(function () {
                $location.path('/');
                $scope.disabled = false;
                $scope.loginForm = {};
            })// handle error
            .catch(function () {
                $scope.error = true;
                $scope.errorMessage = "Invalid username and/or password";
                $scope.disabled = false;
                $scope.loginForm = {};
            });

    }
        ;

}
]);

// Handles the logout function
angular.module('myApp').controller('logoutController', ['$scope', '$location', 'AuthService', function ($scope, $location, AuthService) {

    $scope.logout = function () {

        // call logout from service
        AuthService.logout().then(function () {
            $location.path('/login');
        });

    }
        ;

}
]);

// Handles the register function
angular.module('myApp').controller('registerController', ['$scope', '$location', 'AuthService', function ($scope, $location, AuthService) {

    $scope.register = function () {

        // initial values
        $scope.error = false;
        $scope.disabled = true;

        // call register from service
        AuthService.register($scope.registerForm.username, $scope.registerForm.password)// handle success
            .then(function () {
                $location.path('/login');
                $scope.disabled = false;
                $scope.registerForm = {};
            })// handle error
            .catch(function () {
                $scope.error = true;
                $scope.errorMessage = "Something went wrong!";
                $scope.disabled = false;
                $scope.registerForm = {};
            });

    }
        ;

}
]);

// Controller to take care of other things
angular.module('myApp').controller('homeController', ['$scope', '$location', '$q', '$http', 'AuthService', '$window', '$timeout', '$interval', 'NgMap', function ($scope, $location, $q, $http, AuthService, $window, $timeout, $interval, NgMap) {


    var numMarkers = 0;
    var markers = [];
    var fileData = " ";
    var image = { url: './data/measle_blue.png' };
    // Read the file and store the contents in the string "fileData"
    var txtFile = "./data/RN_Sea_trips.txt";
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

    // console.log("startlat: ") + linecoords[0];
    // console.log("startlong: ") + linecoords[1];
    // console.log("endlat: ") + linecoords[2];
    // console.log("endlong: ") + linecoords[3];

    var vm = this;

    // set the center of the map - found from mean of RN Seattle boundaries
    vm.centerlat = 47.43554;
    vm.centerlong = -122.42;

    // Plotting some of the start points as markers on the Map
    vm.positions = [];
    var generateMarkers = function () {
        vm.positions = [];
        var numMarkers = len ;

        for (i = 0; i < numMarkers; i++) {
            var lat = startLat[i];
            var lng = startLong[i];
            vm.positions.push({
                lat: lat,
                lng: lng
            });
        }
        // console.log("vm.positions", vm.positions);
    };
    generateMarkers();


    NgMap.getMap().then(function (map) {
        vm.map = map;
        // Make geoXML parse our local KML file as KML Layer does not allow for locally hosted KMLs
        var myParser = new geoXML3.parser({ map: map });
        myParser.parse('./data/Google_Maps_data-1130193241.kml');

        // Set the markers in controller instead of view : 
        // <marker ng-repeat="pos in vm.positions" position="{{pos.lat}},{{pos.lng}}" icon="{url:'./data/measle_blue.png'}" on-mouseover="vm.on_startmouseover(pos)"></marker>
        numMarkers = len ;

        for (var i = 0; i < numMarkers; i++) {
            markers[i] = new google.maps.Marker({
                title: "Marker: " + i,
                icon: image
            });
            var lat = startLat[i];
            var lng = startLong[i];
            var loc = new google.maps.LatLng(lat, lng);
            markers[i].setPosition(loc);
            markers[i].setMap(map);
            markers[i].addListener('mouseover', function (marker) {
                on_mouseover(marker);
            });
            markers[i].addListener('mouseout', function (marker) {
                on_mouseout(marker);
            })

        }

    });
    var on_mouseover = function (marker) {
        console.log(marker.latLng.lat());
        for (i = 0; i < numMarkers; i++) {
            markers[i].setOpacity(0.1);
        }
        // Find the end-point corresponding to the start point and draw a line to show a trip
        NgMap.getMap().then(function (map) {
            vm.map = map;
            var markerIndex = startLat.indexOf(marker.latLng.lat());
            var endMarkerPos = { lat: endLat[markerIndex], lng: endLong[markerIndex] };
            var endMarker = new google.maps.Marker({ position: endMarkerPos, icon: image });
            endMarker.setMap(map);
            var startPoint = new google.maps.LatLng(startLat[markerIndex], startLong[markerIndex] );
            var endPoint = new google.maps.LatLng(endLat[markerIndex], endLong[markerIndex] );
            vm.tripPath = [[startLat[markerIndex], startLong[markerIndex]],[endLat[markerIndex], endLong[markerIndex]]];
            // var tripPath = google.maps.Polyline({
            //     path: pathEnds,
            //     strokeColor: '#FF0000',
            //     strokeOpacity: 1.0,
            //     strokeWeight: 2
            // });
            
            //tripPath.setMap(map);
        });

        // markers[markerIndex].setOpacity = 1.0;
        // marker.setOpacity(1);
    }

    // TODO: remove the end-point marker and the polyline on mouseout
    var on_mouseout = function (marker) {

        //console.log(marker.latLng.lat());
        for (i = 0; i < numMarkers; i++) {
            markers[i].setOpacity(1.0);
        }
        // marker.setOpacity(1);
    }



}
]);
