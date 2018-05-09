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
  console.log(latitude, longitude);
  app.myLocation.lat = latitude;
  app.myLocation.long = longitude;
  app.getLocationData();
};

console.log("check lat/long", app.myLocation);

app.onGeolocateError = async function(error) {
  await app.askForLocationInput();
  await app.getLocationData();
};

app.askForLocationInput = function() {
  //Prompt user input
  console.log("user needs to enter locaiton");
};

app.getLocationData = function() {
  const { lat, long } = app.myLocation;
  console.log(lat, long);
  return $.ajax({
    //  API should look like this "lcboapi.com/stores?lat=43.659&lon=-79.439"
    url: `https://lcboapi.com/stores?lat=${lat}&lon=${long}`,
    dataType: "json",
    data: {
      access_key:
        "MDoxNjM0YjQyYS01MmY0LTExZTgtOGFhMS1hN2YxZTA1NzdjODk6MldudWRQa3FWbzRMWmFPSE1yYTFZaUpEQ2YwSGNUWjBnQUJU"
    }
  }).then(apiData => {
    console.log(apiData.result);
    return app.getClosestLocation(apiData.result);
  });
};

app.getClosestLocation = function(locationData) {
  console.log(locationData);
};

app.events = function() {};

app.init = function() {
  app.events();
  app.geolocateMyLocation();
};

$(function() {
  app.init();
});
