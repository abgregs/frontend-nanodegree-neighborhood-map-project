var map;

// Starting coordinates to center on Cap Hill neighborhood.
var startingLat = 39.7341143;
var startingLng = -104.9797753;

// Categories for our places.
var categories = [
  {name: 'Coffee', iconURL: './img/Coffee.svg', query: 'coffee shops in Capitol Hill, Denver, CO'},
  {name: 'Pizza', iconURL: './img/Pizza.svg', query: 'pizza in Capitol Hill, Denver, CO'},
  {name: 'Ice Cream', iconURL: './img/iceCream.svg', query: 'ice cream shops in Capitol Hill, Denver, CO'},
  {name: 'Breweries', iconURL: './img/Brewery.svg', query: 'breweries in Capitol Hill, Denver, CO'}
];

// Listing constructor that will give us an object for each place category that contains the results list of places.
function Listing (results, name, icon) {
  this.results = results;
  this.name = name;
  this.icon = icon;
};

// The place names for our list view
var listNamesControl = [];


var searchBar = document.getElementById('search-bar');

// var searchBar = document.getElementById('search-bar');
// searchBar.addEventListener("blur", function () {
//       this.value='';
//       vm.listNamesLive.removeAll();
//       listNamesControl.forEach(function(name) {
//       vm.listNamesLive.push(name);
//       vm.listNamesLive.sort();
//     })
// });

var ViewModel =  function() {
  var self = this;

  // Place to store our listings for each category
  this.listings = new ko.observableArray([]);

  // Place to store our markers
  this.markers = new ko.observableArray([]);

  // Our list view of places names that will update with live search.
  this.listNamesLive = new ko.observableArray([]);

  // Show or hide the set of markers on the map for a specific category
  this.toggleMarkers = function () {

    searchBar.value='';
    self.listNamesLive.removeAll();

    var markers = self.markers;
    var listingIcon = this.icon;
    markers().forEach(function(marker) {
      var markerIcon = marker.icon.url;
      var markerTitle = marker.title;
      if (listingIcon === markerIcon) {

        if (marker.visible !== false) {
          marker.setVisible(false);

          // We'll also make sure our list of place names used to control the live list view is updated to sync with what markers are on the map.
          var index = listNamesControl.indexOf(markerTitle);
          listNamesControl.splice(index, 1);

        }

        else {
          marker.setVisible(true);

          // We'll also make sure our list of place names used to control the live list view is updated to sync with what markers are on the map.
          listNamesControl.push(markerTitle);
        }
      }
    });

      listNamesControl.forEach(function(name) {
        vm.listNamesLive.push(name);
        vm.listNamesLive.sort();
      });
    };

  this.query = ko.observable('');

  // Match value from our search input to our list of places to create our live search list view.
  this.search = function(value) {
    // var listNamesControl = self.listNamesControl;
    var listNamesLive = self.listNamesLive;
    listNamesLive.removeAll();
    if (value == '') return;

    for (var name in listNamesControl) {
      if (listNamesControl[name].toLowerCase().indexOf(value.toLowerCase()) >= 0) {
        listNamesLive.push(listNamesControl[name]);
      }
      listNamesLive.sort();
    }
  };

  this.activateMarker  = function(placeName) {
    var markers = self.markers;
    markers().forEach(function(marker) {
      var markerTitle = marker.title;
      var markerVisible = marker.visible;
      if (markerTitle === placeName) {

        if (markerVisible === true) {

        google.maps.event.trigger(marker, 'click');

        }
        else {

          alert("Marker not displayed on map");
        }
      }
    });
  };
};

var vm = new ViewModel();
ko.applyBindings(vm);
vm.query.subscribe(vm.search);

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: startingLat, lng: startingLng},
    zoom: 15,
    mapTypeControl: false
  });

  // latLngBounds around Cap Hill neighborhood to bias text search
  var neBound = new google.maps.LatLng(39.7399521, -104.9730662);
  var swBound = new google.maps.LatLng(39.7224799, -104.9883449);
  var bounds = new google.maps.LatLngBounds(neBound, swBound);

  function textSearchPlaces() {
    var placesService = new google.maps.places.PlacesService(map);

    // Get a list of places for each of our categories.
    categories.forEach(function(category) {
      var query = category.query;
      placesService.textSearch({
        query: query,
        bounds: bounds
      }, function(results, status) {
       if (status === google.maps.places.PlacesServiceStatus.OK) {
         var name = category.name;
         var icon = category.iconURL;

        // Get the places from our results and add markers to the map
        createMarkersForPlaces(results, icon);

        // Get the place names from our results list and we will push them to a KO observableArray. This will help us create our list view of place names that refreshes based on the live search feature.
        createListNames(results);

        // Create a listing object for each category that includes the text search results.
        var listing = new Listing(results, name, icon);
        vm.listings.push(listing);
      }
      else {
        alert("Places request was not successful for the following reasons: " + status);
      }
     });
   });


   };

   textSearchPlaces();

   // Create a single infowindow to be used with the place details information
   // so that only one is open at once.
   var placeInfoWindow = new google.maps.InfoWindow();

  // Create list of place names that we will use for our list view.
  function createListNames(results) {
    results.forEach(function(result) {
      var name = result.name;
      listNamesControl.push(name);
      vm.listNamesLive.push(name);
      vm.listNamesLive.sort();
    })
  }


  function createMarkersForPlaces(places, iconURL) {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < places.length; i++) {
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
        visible: true,
        title: place.name,
        position: place.geometry.location,
        id: place.place_id
      });

      vm.markers.push(marker);

      // If a marker is clicked, get its place details and display in infowindow.
      marker.addListener('click', makeActiveMarker);

      var makeActiveMarker = function () {
        this.setAnimation(google.maps.Animation.DROP);
        if (placeInfoWindow.marker == this) {
         console.log("This infowindow already is on this marker!");
        } else {
         getPlacesDetails(this, placeInfoWindow);
        }
      };

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
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // Set the marker property on this infowindow so it isn't created again.
      infowindow.marker = marker;
      var innerHTML = '<div>';
      if (place.name) {
        innerHTML += '<strong>' + place.name + '</strong>';
      }
      if (place.formatted_address) {
        innerHTML += '<br>' + place.formatted_address;
      }
      if (place.photos) {
        innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
            {maxHeight: 100, maxWidth: 200}) + '">';
      }
      if (place.photos === undefined) {
        innerHTML += '<br><br>Sorry, there is no photo available for this place'
      }
      innerHTML += '</div>';
      infowindow.setContent(innerHTML);
      infowindow.open(map, marker);
      // Make sure the marker property is cleared if the infowindow is closed.
      infowindow.addListener('closeclick', function() {
        infowindow.marker = null;
      });
    }
  });
}

 }









// setTimeout(function(){ console.log(vm.markers()); }, 4000);
setTimeout(function(){ console.log(vm.listings()); }, 4000);
// setTimeout(function(){ console.log(listNamesControl); }, 4000);
