styles = [
  {
    featureType: "all",
    elementType: "all",
    stylers: [
      {
        hue: "#00ffbc"
      }
    ]
  },
  {
    featureType: "poi",
    elementType: "all",
    stylers: [
      {
        visibility: "off"
      }
    ]
  },
  {
    featureType: "road",
    elementType: "all",
    stylers: [
      {
        saturation: -70
      }
    ]
  },
  {
    featureType: "transit",
    elementType: "all",
    stylers: [
      {
        visibility: "off"
      }
    ]
  },
  {
    featureType: "water",
    elementType: "all",
    stylers: [
      {
        visibility: "simplified"
      },
      {
        saturation: -60
      }
    ]
  }
];

const app = {};

app.myLocation = { lat: 43.64918, long: -79.397859 };
app.storeLocation = { lat: 0, long: 0 };
app.locationInfo = { name: "", address1: "", city: "", postal: "" };
app.locationOpenTime = 0;
app.locationCloseTime = 0;
// Count of Stores Cycled through
app.locationProxity = 0;

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
    // dataType: "json",
    headers: {
      Authorization:
        "Token MDoxZmM1ZTM2NC01NmM5LTExZTgtOWI5My1kNzgyNTIxMGJmYmQ6MTBKdFo4dHRGeXo5VTRnSkNvUzFYMWVPUWsxS3dLTFFScnpl"
    },
    data: {
      order: "distance_in_meters"
    }
  }).then(apiData => {
    return app.getClosestLocation(apiData.result);
  });
};

app.getClosestLocation = function(locationData) {
  //app.locationProxity set to 0 getting first location....
  const closestLocation = locationData[app.locationProxity];
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

  app.locationProxity = app.locationProxity + 1;
  console.log(`current location #: ${app.locationProxity}`);
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
  $(".name-input").html(app.locationInfo.name);
  $(".address-input").html(app.locationInfo.address1);

  const pad = num => (num < 10 ? "0" : "") + num;
  const time = secondsInput => {
    let seconds = secondsInput;
    let hours = pad(Math.floor(seconds / 3600));
    seconds %= 3600;
    let minutes = pad(Math.floor(seconds / 60));

    return hours + minutes;
  };

  const openClose = `${time(app.locationOpenTime)} TO ${time(
    app.locationCloseTime
  )}`;
  $(".hours-input").html(openClose);
  app.liveMap();
  // run funcitons below in set intervals and display on page every second
  setInterval(app.calculateCounters, 1000);
  // app.calculateCounters();
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
    $(`li[data-mode=${key}]>.counter`).html(finalCounter);
    $(`li[data-mode=${key}]>.travel-time`).html(finalTravelTime);
    $(".loading").css("display", "none");
    if (countdownSeconds === 0) {
      $(`li[data-mode=${key}]>.icon`).addClass("red");
    } else if (
      countdownSeconds < 900 &&
      countdownSeconds > 0 &&
      hoursCounter === 0
    ) {
      $(`li[data-mode=${key}]>.icon`).addClass("orange");
    } else {
      $(`li[data-mode=${key}]>.icon`).addClass("green");
    }
    $(".mode-of-transport").css("display", "flex");
    app.locationProxity > 1
      ? $(".next-store").css("display", "inline-block")
      : "";
  }
};

app.events = function() {
  $("#next").on("click", () => {
    app.getLocationData();
  });
  $("#refresh").on("click", () => {
    app.locationProxity = 0;
    $(".next-store").css("display", "none");
    app.getLocationData();
  });
  $("#map").on("click", () => {
    const win = window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${
        app.storeLocation.lat
      },${app.storeLocation.long}`,
      "_blank"
    );
    if (win) {
      win.focus();
    } else {
      alert("Please allow popups for this website");
    }
  });
  $("#manual").on("click", () => {});
};

app.liveMap = function() {
  const origin = {
    lat: app.myLocation.lat,
    lng: app.myLocation.long
  };
  const destination = {
    lat: app.storeLocation.lat,
    lng: app.storeLocation.long
  };
  const directionsService = new google.maps.DirectionsService();
  const directionsDisplay = new google.maps.DirectionsRenderer();
  const map = new google.maps.Map(document.getElementById("liveMap"), {
    zoom: 12,
    center: destination,
    styles
  });

  directionsDisplay.setMap(map);

  calculateAndDisplayRoute(directionsService, directionsDisplay);

  function calculateAndDisplayRoute(directionsService, directionsDisplay) {
    directionsService.route(
      {
        origin,
        destination,
        travelMode: "WALKING"
      },
      function(response, status) {
        if (status === "OK") {
          directionsDisplay.setDirections(response);
        } else {
          window.alert("Directions request failed due to " + status);
        }
      }
    );
  }
};

app.init = function() {
  app.events();
  app.geolocateMyLocation();
};

$(function() {
  app.init();
});
