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

app.myLocation = { lat: 43.64918, long: -79.397859};
app.storeLocation = {
  lat: 0,
  long: 0
};
app.locationCloseTime = 0;
app.travelTimeMinutes = 0;

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
        order: 'distance_in_meters',
    }
  }).then(apiData => {
    return app.getClosestLocation(apiData.result);
  });
};

app.getClosestLocation = function(locationData) {

  const closestLocation = locationData[0];

  // location.name, location.longitude, location.latitude
  let locationName = closestLocation.name;

  app.storeLocation.long = closestLocation.longitude;
  app.storeLocation.lat = closestLocation.latitude;


  // Today returns today's day in numerical value
  // 0 - Sunday, 1 - Monday, 6 - Saturday and etc.
  const today = new Date().getDay();

  const daysArr = ['sunday_close', 'monday_close', 'tuesday_close', 'wednesday_close', 'thursday_close', 'friday_close', 'saturday_close'];
  // This will set match the day with the correct
  // closing day call 
  let closingDay = daysArr[today];
  console.log(`Closing day is:`, closingDay);
  // returns the closing time of the current day
  app.locationCloseTime = closestLocation[closingDay];
  console.log('todays close time:', app.locationCloseTime);
  
  app.getTravelTime();
};

app.getTravelTime = function() {
  let origin = new google.maps.LatLng(app.myLocation.lat, app.myLocation.long);
  let destination = new google.maps.LatLng(app.storeLocation.lat, app.storeLocation.long);
  var service = new google.maps.DistanceMatrixService();
  service.getDistanceMatrix(
    {
      origins: [origin],
      destinations: [destination],
      travelMode: 'DRIVING',
    }, callback);

  function callback(response, status) {
    // See Parsing the Results for
    // the basics of a callback function.
    let travelTimeSeconds = response.rows[0].elements[0].duration.value;
    app.travelTimeMinutes = Math.ceil(travelTimeSeconds / 60);
  }
}

app.howLongDoWeHave = function() {
  const currentTimeHour = new Date().getHours();
  const currentTimeMinutes = new Date().getMinutes();
  let currentTimeMinutesTotal = (currentTimeHour * 60) + currentTimeMinutes;
  console.log(currentTimeMinutesTotal); 
  console.log(`countdown CLose time`, app.locationCloseTime);
  console.log(`Travel time in minutes is:`, app.travelTimeMinutes);
  const countDown = app.locationCloseTime - app.travelTimeMinutes - currentTimeMinutesTotal;
  console.log(countDown);
}


app.events = function() {};

app.init = function() {
  app.events();
  app.geolocateMyLocation();

};

$(function() {
  app.init();
});
