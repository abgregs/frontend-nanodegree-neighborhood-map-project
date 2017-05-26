// Get current date in DDMMYYYY for versioning param in foursquare
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1;

var yyyy = today.getFullYear();
if(dd<10){
    dd='0'+dd;
}
if(mm<10){
    mm='0'+mm;
}
var today = yyyy+mm+dd;

// another foursquare versioning param
var m = 'foursquare';

// Param for search radius
var radius = "150";

// Param for limiting number of search results
var limit = '1';





var map;

// Starting coordinates to center on Cap Hill neighborhood.
var startingLat = 39.7341143;
var startingLng = -104.9797753;

// Categories for our places.
var categories = [
  {name: 'Coffee', iconURL: './img/Coffee.svg', query: 'coffee shops in Capitol Hill, Denver, CO'},
  {name: 'Pizza', iconURL: './img/Pizza.svg', query: 'pizza in Capitol Hill, Denver, CO'},
  {name: 'Ice Cream', iconURL: './img/iceCream.svg', query: 'homeade ice cream in Capitol Hill, Denver, CO'},
  {name: 'Breweries', iconURL: './img/Brewery.svg', query: 'breweries in Capitol Hill, Denver, CO'}
];

categories.forEach(function (category) {
    var file = category.iconURL;
$.ajax({
      type: 'HEAD',
      url: file,
      error: function() {
          alert("The following error occured: The map marker icon image file " + file + " wasn't found");
      }
  });
});

categories.forEach(function(category) {
  var imgURL = category.iconURL;

});


// Listing constructor that will give us an object for each place category that contains the results list of places.
function Listing (results, name, icon) {
  this.results = results;
  this.name = name;
  this.icon = icon;
};

// The place names for our list view
var listNamesControl = [];

// Place to store our markers
var markers = [];

var searchBar = document.getElementById('search-bar');

var ViewModel =  function() {
  var self = this;

  // Place to store our listings for each category
  this.listings = new ko.observableArray([]);

  // Our list view of places names that will update with live search.
  this.listNamesLive = new ko.observableArray([]);

  // Show or hide the set of markers on the map for a specific category
  this.toggleMarkers = function () {

    searchBar.value='';
    self.listNamesLive.removeAll();

    var listingIcon = this.icon;
    markers.forEach(function(marker) {
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

    markers.forEach(function(marker) {
      var markerTitle = marker.title;
      var markerVisible = marker.visible;
      if (markerTitle === placeName) {

        if (markerVisible === true) {

        google.maps.event.trigger(marker, 'click');

        }
        else {

          alert("Oops, this marker is not displayed on map");
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

        // Create a listing object for each category that includes the text search results.
        var listing = new Listing(results, name, icon);
        vm.listings.push(listing);

        // Get the places from our results and add markers to the map
        createMarkersForPlaces(results, icon);

        // Get the place names from our results list and we will push them to a KO observableArray. This will help us create our list view of place names that refreshes based on the live search feature.
        createListNames(results);

      }
      else {
        alert("Places request was not successful for the following reasons: " + status);
      }
     });
   });

   };

   // Places search to get a list of places based on our initial categories, and defined above.
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
        visible: true,
        title: place.name,
        position: place.geometry.location,
        id: place.place_id
      });

      // Create list of markers
      markers.push(marker);

      // Using the marker information to do a search in foursquare and get other information, which we'll later include in our infowindow.
      getFoursquareData(marker);


      // If a marker is clicked, get its place details and display in infowindow.
      marker.addListener('click', function() {
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
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // Set the marker property on this infowindow so it isn't created again.
      infowindow.marker = marker;
      var innerHTML = '<div id="infowindow-content">';
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
        innerHTML += '<br><br>' + "Sorry, Google couldn't find a photo of this place!"
      }

      if (marker.venueName) {
        innerHTML += '<br><br>Venue name: ' + marker.venueName;
      }

      if (marker.venueName === undefined) {
        innerHTML += '<br>' + "Sorry, Foursquare couldn't locate this venue!"
      }

      if (marker.hours) {
        innerHTML += '<br>'+ "Today's hours: " + marker.hours.status;
      }

      if (marker.price) {
        innerHTML += '<br>'+ "Price: " + marker.price.message;
      }

      if(marker.menu) {
        innerHTML += '<br><a target="_blank" href="' + marker.menu.url +'">View Menu</a>';
        if (marker.url) {
          innerHTML += ' | <a target="_blank" href="' + marker.url +'">View Website</a>';
        }
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


// Pass in each new marker and make requests to foursquare for more information about that location.
function getFoursquareData(marker) {

 // For testing if helpful to pass a query param to find our venue.
 var query = marker.title;

 // Format the latLng from Google to fit the "ll" param used in foursquare, getting rid of parenths and spaces.
 var ll = marker.position;
 ll = ll.toString();
 ll = ll.replace(/\s+/g, '');
 ll = ll.slice(1, -1);

 $.ajax({
   dataType: "json",
   url: "https://api.foursquare.com/v2/venues/search?client_id=G0W4ZXCGBU5LBPBWHFUY53MKSW125RAWMAVVSJXUUPKVDQNY&client_secret=2YGNDY3DZZVQX1DRZEQKAUI333O2TESFOTTVE5KT3LQKDSUU" + "&ll=" + ll + "&query=" + query + "&limit=" + limit + "&v=" + today + "&m=" + m,
   success: function (data) {

     var venueID = data.response.venues[0].id;

     $.ajax({
       dataType: "json",
       url: "https://api.foursquare.com/v2/venues/" + venueID + "?client_id=G0W4ZXCGBU5LBPBWHFUY53MKSW125RAWMAVVSJXUUPKVDQNY&client_secret=2YGNDY3DZZVQX1DRZEQKAUI333O2TESFOTTVE5KT3LQKDSUU" + "&v=" + today + "&m=" + m,
       success: function (data) {

        // Make the new information part of our marker, then use it to customize our infowindow with 3rd party API (when we set the content of the infowindow).
        marker.venueName = data.response.venue.name;
        marker.hours = data.response.venue.hours;
        marker.price = data.response.venue.price;
        marker.menu = data.response.venue.menu;
        marker.url = data.response.venue.url;
      },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          alert('An error occured: ' );
     }
     });
   },
   error: function(XMLHttpRequest, textStatus, errorThrown) {
     alert('An error occured: ' );
}
  });
};



setTimeout(function(){ console.log(markers)}, 12000);
