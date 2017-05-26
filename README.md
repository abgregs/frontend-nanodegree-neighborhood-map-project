Front-End Web Development Nano-Degree - Neighborhood Map Project
================================================================

What is it?
-----------
In this project I used the Google Maps JavaScript API to create a map of my neighborhood, trigger Google places search requests for areas of interest, and dynamically display them on the map. The theme for the areas of interest is food and drink. The categories for the places are included are listed at the top of the app, and when clicked, will show or hide the list of all places marked on the map belonging to that category.

The map also includes a live search feature that filters a list view of the places to display only those places matching the text input. This list view will update with each key stroke of the text entered in the search input.

All locations will be displayed on the map and all names included in the list view by default. Clicking a map marker or the place name in the list view displays unique information about the location in an info window and also animates the selected marker.

The information displayed for each marker on the map is requested through the Google Maps JavaScript API and the Foursquare API. Methods for handling errors are implemented throughout wherever external resources are required or requests are made.

Getting Started
---------------

To get started, download the project here: https://github.com/abgregs/frontend-nanodegree-neighborhood-map-project

Load index.html in your browser to view the app.

The project currently contains an `index.html` and `img`, `js`, and `css` folders.

Within the `js` folder the Knockout.js and jQuery libraries are included along with an `app.js` file that contains our initial data, a view model, and makes use of Google Maps to customize our markers and overall map view experience. Knockout.js is used for binding data from our view model and refreshing our UI based on interactions from the user.

The `css` folder just contains a `styles.css` file where all styles are applied.

The `img` folder contains custom icon images used for our map marker icons.

References
-------------------

Some of the concepts and solutions used in this app have been borrowed from or inspired from the following sources:

Live search with Knockout.js: http://opensoul.org/2011/06/23/live-search-with-knockoutjs/
https://gist.github.com/hinchley/5973926#file-knockout-live-search

Positioning and layout of the map: http://stackoverflow.com/questions/7213503/set-google-map-canvas-width-100-minus-sidebar-width

Getting today's date: https://stackoverflow.com/questions/12409299/how-to-get-current-formatted-date-dd-mm-yyyy-in-javascript-and-append-it-to-an-i
