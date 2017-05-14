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

// Data model storing our categories and lists of Places objects that go with each.
var listings = [];

// Place constructor that will give us an object for each place category that contains the results list of places.
function Place (results, name, icon) {
  this.results = results;
  this.name = name;
  this.icon = icon;
};

var ViewModel =  function() {
  var self = this;
  this.listings = ko.observableArray([]);

  // Get our place listings and push to ko observableArray.
  listings.forEach(function (listing) {
            if (listings.length < categories.length) {
              setTimeout(wait,100);
              }
            else {
              self.listings.push(listing);
              }
          });

};

ko.applyBindings(new ViewModel());

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
            createMarkersForPlaces(results, icon);

            // Create a place object for each category that includes the text search results.
            var place = new Place(results, name, icon);
            listings.push(place);
      }
     });
   });

 };

  function createMarkersForPlaces(places, categoryIcon) {
    var bounds = new google.maps.LatLngBounds();
    for (var i = 0; i < places.length; i++) {
      var place = places[i];
      var icon = {

        // Replace icon's url with the iconURL we passed in from our categories array.
        url: categoryIcon,

        size: new google.maps.Size(40, 40),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(15, 34),
        scaledSize: new google.maps.Size(25, 25)
      };
      // Create a marker for each place.
      var marker = new google.maps.Marker({
        map: map,
        icon: icon,
        title: place.name,
        position: place.geometry.location,
        id: place.place_id
      });

      // Create a single infowindow to be used with the place details information
      // so that only one is open at once.
      var placeInfoWindow = new google.maps.InfoWindow();
      // If a marker is clicked, do a place details search on it in the next function.
      marker.addListener('click', function() {
        if (placeInfoWindow.marker == this) {
          console.log("This infowindow already is on this marker!");
        } else {
          getPlacesDetails(this, placeInfoWindow);
        }
      });
      // placeMarkers.push(marker);
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

textSearchPlaces();
}


setTimeout(function(){ console.log(listings); }, 3000);
setTimeout(function(){ console.log(ViewModel.listings()); }, 6000);
