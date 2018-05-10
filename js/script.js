// Project Break Down
// 1. Allow users to place their location via geolocation or google api.
// Need to return long & Lat of location
// 2. Need a call function to LCBO using the inputted geolocation + the date
// return closest lcbo information including - address and closing time (Based on the inputted date)
// 3. Using the 2 long & lat coordinates, we will feed the information to another
//google distance api and return travel time
// 4. Then with the returned information, we need functions for the following:
// A. Can we make it to the location 15 minutes before closing by any means
// B. Show location information of the returned LCBO
// Stretched Goals
// C. Show more than 1 location
// D. Let us know which method of travel is viable to selected location

const app = {};

app.myLocation = { lat: 43.64918, long: -79.397859 };
app.storeLocation = { lat: 0, long: 0 };
app.locationInfo = { name: "", address1: "", city: "", postal: "" };
app.locationOpenTime = 0;
app.locationCloseTime = 0;
app.travelTimeSeconds = { DRIVING: 0, TRANSIT: 0, BICYCLING: 0, WALKING: 0 };

//Ask for geolocation
app.geolocateMyLocation = function() {
  if (window.navigator && window.navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      app.onGeolocateSuccess,
      app.onGeolocateError
    );
  } else {
    app.askForLocationInput();
  }
};

app.onGeolocateSuccess = function(geoData) {
  const { latitude, longitude } = geoData.coords;
  app.myLocation.lat = latitude;
  app.myLocation.long = longitude;
  app.getLocationData();
};

app.onGeolocateError = async function(error) {
  await app.askForLocationInput();
  await app.getLocationData();
};

app.askForLocationInput = function() {
  //Prompt user input
  console.log("user needs to enter location");
};

app.getLocationData = function() {
  const { lat, long } = app.myLocation;
  return $.ajax({
    //  API should look like this "lcboapi.com/stores?lat=43.659&lon=-79.439"
    url: `https://lcboapi.com/stores?lat=${lat}&lon=${long}`,
    dataType: "json",
    data: {
      access_key:
        "MDoxNjM0YjQyYS01MmY0LTExZTgtOGFhMS1hN2YxZTA1NzdjODk6MldudWRQa3FWbzRMWmFPSE1yYTFZaUpEQ2YwSGNUWjBnQUJU",
      order: "distance_in_meters"
    }
  }).then(apiData => {
    return app.getClosestLocation(apiData.result);
  });
};

app.getClosestLocation = function(locationData) {
  const closestLocation = locationData[0];
  app.locationInfo.name = closestLocation.name;
  app.locationInfo.address1 = closestLocation.address_line_1;
  app.locationInfo.city = closestLocation.city;
  app.locationInfo.postal = closestLocation.postal_code;
  app.storeLocation.long = closestLocation.longitude;
  app.storeLocation.lat = closestLocation.latitude;

  // Today returns today's day in numerical value with 0 - Sunday, 1 - Monday, 6 - Saturday and etc.
  const today = new Date().getDay();
  const daysArr = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday"
  ];

  // returns the closing time of the current day in seconds (api returns in mins)
  app.locationCloseTime = closestLocation[daysArr[today] + "_close"] * 60;
  app.locationOpenTime = closestLocation[daysArr[today] + "_open"] * 60;
  app.getTravelTime();
};

app.getTravelTime = function() {
  const travelModes = ["DRIVING", "TRANSIT", "BICYCLING", "WALKING"];
  // for testing hacker you origin lat: 43.64918, long: -79.397859
  // let origin = new google.maps.LatLng(43.64918, -79.397859);
  let origin = new google.maps.LatLng(app.myLocation.lat, app.myLocation.long);
  let destination = new google.maps.LatLng(
    app.storeLocation.lat,
    app.storeLocation.long
  );
  // From Google DistanceMatrix API
  let service = new google.maps.DistanceMatrixService();
  // for each travel mode get travel time
  count = 0;
  travelModes.forEach(travelMode => {
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: travelMode
      },
      function(response, status) {
        //all functions returned untill callback up to this poing... check if we can async/await before instead of using counter to hold back startCounter()
        let travelModeTimeSeconds = response.rows[0].elements[0].duration.value;
        app.travelTimeSeconds[travelMode] = travelModeTimeSeconds;
        count++;
        count == 4 ? app.startCounter() : "";
      }
    );
  });
};

app.startCounter = function() {
  // display results here SWITCH OUT OF LOADING SCREEN!!!
  console.log(app.locationInfo);
  // run funcitons below in set intervals and display on page every second
  // setInterval(app.calculateCounters, 1000);
  app.calculateCounters();
};

app.calculateCounters = function() {
  const hours = new Date().getHours();
  const minutes = new Date().getMinutes();
  const seconds = new Date().getSeconds();
  let currentTimeInSeconds = hours * 3600 + minutes * 60 + seconds;
  // for each travel mode (stored in keys) calc counter time and travel time
  for (let key in app.travelTimeSeconds) {
    let countdownSeconds =
      app.locationCloseTime - app.travelTimeSeconds[key] - currentTimeInSeconds;
    // set countdown to zero if it is below zero
    if (countdownSeconds <= 0) {
      countdownSeconds = 0;
    }

    //Calculate hr, min, sec for counter
    let hoursCounter = Math.floor(countdownSeconds / 3600);
    countdownSeconds %= 3600;
    let minutesCounter = Math.floor(countdownSeconds / 60);
    let secondsCounter = countdownSeconds % 60;

    // Calculate hr, min for Travel Time
    let travelSeconds = app.travelTimeSeconds[key];
    let hoursTravel = Math.floor(travelSeconds / 3600);
    travelSeconds %= 3600;
    let minutesTravel = Math.floor(travelSeconds / 60);
    let secondsTravel = travelSeconds % 60;
    const pad = num => (num < 10 ? "0" : "") + num;
    let finalCounter = `${pad(hoursCounter)} : ${pad(minutesCounter)} : ${pad(
      secondsCounter
    )}`;

    let finalTravelTime = `${hoursTravel === 0 ? "" : hoursTravel + " hrs "}${
      minutesTravel === 0 ? "" : minutesTravel + " min"
    } ${minutesTravel === 0 ? secondsTravel : ""}`;

    console.log(key, "counter:", finalCounter);
    console.log(key, "travel time:", finalTravelTime);
  }

  // console.log("count down in seconds", countDown);
};

app.events = function() {};

app.init = function() {
  app.events();
  app.geolocateMyLocation();
};

$(function() {
  app.init();
});
