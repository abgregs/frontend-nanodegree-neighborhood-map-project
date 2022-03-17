// Get current date in YYYYMMDD for versioning param in foursquare
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth() + 1;

var yyyy = today.getFullYear();

if (dd < 10) {
  dd = "0" + dd;
}
if (mm < 10) {
  mm = "0" + mm;
}
var today = "" + yyyy + "" + mm + "" + dd + "";

// another foursquare versioning param
var m = "foursquare";

// Param for search radius in foursquare
var radius = "150";

// Param for limiting number of search results in foursquare
var limit = "1";

var map;

// Starting coordinates to center on Cap Hill neighborhood.
var startingLat = 39.7341143;
var startingLng = -104.9797753;

// Categories for our places.
var categories = [
  {
    name: "Coffee",
    iconURL: "./img/Coffee.svg",
    query: "coffee shops in Capitol Hill, Denver, CO"
  }, {
    name: "Pizza",
    iconURL: "./img/Pizza.svg",
    query: "pizza in Capitol Hill, Denver, CO"
  }, {
    name: "Ice Cream",
    iconURL: "./img/iceCream.svg",
    query: "homeade ice cream in Capitol Hill, Denver, CO"
  }, {
    name: "Breweries",
    iconURL: "../img/Brewery.svg",
    query: "breweries in Capitol Hill, Denver, CO"
  }
];

// Google map loading error handling
function mapError() {
  alert("Error warning: Google map could not load");
}

// Listing constructor that will give us an object for each place category that contains the results list of places.
function Listing(results, name, icon) {
  this.results = results;
  this.name = name;
  this.icon = icon;
  this.isVisible = new ko.observable(true);
}

var ViewModel = function () {
  var self = this;

  // Our listings based on our initial categories.
  this.listings = new ko.observableArray([]);

  // Our markers that we will filter through for live search and match based on categories selected.
  this.markers = new ko.observableArray([]);

  // Used to get text input for live search filter.
  this.searchKeyword = new ko.observable("");

  // Changes the visible setting property of each category when clicked.
  this.setIsVisible = function () {
    this.isVisible()
      ? this.isVisible(false)
      : this.isVisible(true);
    console.log(this.isVisible());
  };

  // Get the value from our text input to filter markers and place names based on search keyword and category selection.
  this.filterNames = ko.computed(function () {
    var markers = self.markers();
    var listings = self.listings();

    return ko.utils.arrayFilter(markers, function (marker) {
      var matchSearch = marker.title.toLowerCase().indexOf(self.searchKeyword().toLowerCase()) !== -1;

      var matchCat = true;

      // Return matchCat false for any markers in a category whose markers are set to hidden (filter out any categories that have been de-selected).
      listings.forEach(function (listing) {
        if (marker.category === listing.name && !listing.isVisible()) {
          matchCat = false;
        }
      });

      var match = matchSearch && matchCat;
      marker.setVisible(match);
      return match;
    });
  });

  // Triggers click event on our marker to open infowindow.
  this.activateMarker = function (marker) {
    var markerVisible = marker.visible;
    if (markerVisible === true) {
      google.maps.event.trigger(marker, "click");
    } else {
      alert("Oops, this marker is not displayed on map");
    }
  };

  // End of view model.
};

var vm = new ViewModel();
ko.applyBindings(vm);

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    center: {
      lat: startingLat,
      lng: startingLng
    },
    zoom: 15,
    mapTypeControl: false
  });

  if (typeof google === "object" && typeof google.maps === "object") {
    console.log("Success");
  } else {
    alert("Google Maps API did not load successfully due to internet connectivity issues.");
  }

  // latLngBounds around Cap Hill neighborhood to bias text search
  var neBound = new google.maps.LatLng(39.7399521, -104.9730662);
  var swBound = new google.maps.LatLng(39.7224799, -104.9883449);
  var bounds = new google.maps.LatLngBounds(neBound, swBound);

  function textSearchPlaces() {
    var placesService = new google.maps.places.PlacesService(map);

    // Get a list of places for each of our categories.
    categories.forEach(function (category) {
      var query = category.query;
      placesService.textSearch({
        query: query,
        bounds: bounds
      }, function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          var name = category.name;
          var iconURL = category.iconURL;

          // Create a listing object for each category that includes the text search results.
          var listing = new Listing(results, name, iconURL);
          vm.listings.push(listing);

          // Get the places from our results and add markers to the map
          createMarkersForPlaces(results, iconURL, name);
        } else {
          alert("Places request was not successful for the following reason: " + status);
        }
      });
    });
  }

  // Places search to get a list of places based on our initial categories, and defined above.
  textSearchPlaces();

  // Create a single infowindow to be used with the place details information
  // so that only one is open at once.
  var placeInfoWindow = new google.maps.InfoWindow();

  function createMarkersForPlaces(places, iconURL, categoryName) {
    var bounds = new google.maps.LatLngBounds();
    for (var i in places) {
      var place = places[i];
      var icon = {
        // Replace icon's url with the iconURL we passed in from our categories array.
        url: iconURL,

        size: new google.maps.Size(40, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 34),
        scaledSize: new google.maps.Size(25, 25)
      };

      // Create a marker for each place.
      var marker = new google.maps.Marker({
        map: map,
        icon: icon,
        category: categoryName,
        visible: true,
        title: place.name,
        position: place.geometry.location,
        id: place.place_id
      });

      // Create list of markers
      vm.markers.push(marker);

      // Using the marker information to do a search in foursquare and get other information, which we'll later include in our infowindow.
      getFoursquareData(marker);

      // If a marker is clicked, get its place details and display in infowindow.
      marker.addListener("click", function () {
        this.setAnimation(google.maps.Animation.DROP);
        if (placeInfoWindow.marker == this) {
          console.log("This infowindow already is on this marker!");
        } else {
          getPlacesDetails(this, placeInfoWindow);
        }

        map.setCenter(this.getPosition());
        map.panBy(-130, 0);
      });

      if (place.geometry.viewport) {
        // Only geocodes have viewport.
        bounds.union(place.geometry.viewport);
      } else {
        bounds.extend(place.geometry.location);
      }
    }
    map.fitBounds(bounds);
  }

  // Places details search, executed when a marker is selected
  function getPlacesDetails(marker, infowindow) {
    var service = new google.maps.places.PlacesService(map);
    service.getDetails({
      placeId: marker.id
    }, function (place, status) {
      if (status === google.maps.places.PlacesServiceStatus.OK) {
        // Set the marker property on this infowindow so it isn't created again.
        infowindow.marker = marker;
        var innerHTML = '<div id="infowindow-content">';

        place.name
          ? (innerHTML += "<strong>" + place.name + "</strong>")
          : (innerHTML += "<strong>" + "No place name available from Google");

        place.formatted_address
          ? (innerHTML += "<br>" + place.formatted_address)
          : (innerHTML += "<br>" + "No address available from Google");

        place.photos
          ? (innerHTML += '<br><br><img src="' + place.photos[0].getUrl({maxHeight: 100, maxWidth: 200}) + '">')
          : (innerHTML += "<br><br>" + "Sorry, Google couldn't find a photo of this place!");

        marker.venueName
          ? (innerHTML += "<br><br>Foursquare Venue Result: " + marker.venueName)
          : (innerHTML += "<br>" + "Sorry, Foursquare couldn't find a venue here!");

        marker.hours
          ? (innerHTML += "<br>" + "Today's hours: " + marker.hours.status)
          : (innerHTML += "<br>" + "Hours not available");

        marker.price
          ? (innerHTML += "<br>" + "Price: " + marker.price.message)
          : (innerHTML += "<br>" + "Price level not available");

        marker.menu
          ? (innerHTML += '<br><a target="_blank" href="' + marker.menu.url + '">View Menu</a>')
          : (innerHTML += "<br>" + "Menu not available");

        marker.url
          ? (innerHTML += ' | <a target="_blank" href="' + marker.url + '">View Website</a>')
          : (innerHTML += " | Website not available");

        innerHTML += "</div>";
        infowindow.setContent(innerHTML);
        infowindow.open(map, marker);

        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener("closeclick", function () {
          infowindow.marker = null;
        });
      }
    });
  }
}

// Pass in each new marker and make requests to foursquare for more information about that location.
function getFoursquareData(marker) {
  // For testing if helpful to pass a query param to find our venue.
  var query = marker.title;

  // Format the latLng from Google to fit the "ll" param used in foursquare, getting rid of parens and spaces.
  var ll = marker.position;
  ll = ll.toString();
  ll = ll.replace(/\s+/g, "");
  ll = ll.slice(1, -1);

  $.ajax({
    dataType: "json",
    url: "https://api.foursquare.com/v2/venues/search?client_id=G0W4ZXCGBU5LBPBWHFUY53MKSW125RAWMAVVSJXUUPKVDQNY&client_secret=GHZ4IMQJ33R0CSEBYIMDO5HJQVGGZOENZHDHFOW2MWOK2QBD" + "&ll=" + ll + "&query=" + query + "&limit=" + limit + "&v=" + today + "&m=" + m,
    success: function (data) {
      if (data.response.venues[0]) {
        var venueID = data.response.venues[0].id;

        $.ajax({
          dataType: "json",
          url: "https://api.foursquare.com/v2/venues/" + venueID + "?client_id=G0W4ZXCGBU5LBPBWHFUY53MKSW125RAWMAVVSJXUUPKVDQNY&client_secret=GHZ4IMQJ33R0CSEBYIMDO5HJQVGGZOENZHDHFOW2MWOK2QBD" + "&v=" + today + "&m=" + m,
          success: function (data) {
            // Make the new information part of our marker, then use it to customize our infowindow with 3rd party API (when we set the content of the infowindow).
            marker.venueName = data.response.venue.name;
            marker.hours = data.response.venue.hours;
            marker.price = data.response.venue.price;
            marker.menu = data.response.venue.menu;
            marker.url = data.response.venue.url;
          },
          error: function (error) {
            alert("The following error occured when fetching from FourSquare API: " + error.responseText);
          }
        });
      }
    },
    error: function (error) {
      alert("The following error occured when fetching from FourSquare API: " + error.responseText);
    }
  });
}