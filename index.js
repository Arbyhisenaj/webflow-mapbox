// ----------- MAPBOX SETUP CODE BELOW -----------
mapboxgl.accessToken = "pk.eyJ1IjoiY29tbW9ua25vd2xlZGdlIiwiYSI6ImNqc3Z3NGZxcDA4NGo0OXA2dzd5eDJvc2YifQ.f68VZ1vlc6s3jg3JgShd0A";


// Create empty locations GeoJSON object
let mapLocations = {
  type: "FeatureCollection",
  features: []
};

let selectedMapLocations = [];

// Initialize map and load in #map wrapper
let map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/light-v11",
  center: [-3.205, 54.437],
  zoom: 5.36
});

// Adjust zoom of map for mobile and desktop
let mq = window.matchMedia("(min-width: 480px)");
map.setZoom(mq.matches ? 5.36 : 4.8);

// Add zoom and rotation controls to the map
map.addControl(new mapboxgl.NavigationControl());

// ----------- WEBFLOW CMS CODE BELOW -----------

// Get CMS items
let listLocations = document.getElementById("location-list").childNodes;

// For each collection item, grab hidden fields and convert to GeoJSON property
async function getGeoData() {


  listLocations.forEach(async function (location, i) {
    let locationLat = location.querySelector("#locationLatitude").value;
    let locationLong = location.querySelector("#locationLongitude").value;
    
    let postcode = location.querySelector("#postcode").textContent; // Add this line
    //let locationLong = location.querySelector("#locationLongitude").value;
    let locationInfo = location.querySelector(".locations-map_card").innerHTML;
    let siteType = location.querySelector(".sitetype").innerHTML;
    let coordinates = [locationLong, locationLat];
    let locationID = location.querySelector("#locationID").value;

    // This is so every item has an initial ID
    let arrayID = i;
    // This is the dyn Order of the CMS items if geocoding is used
    let dynOrder = i;
    
    // // Use the getLatLongFromPostcode function
    // if (postcode) {
    //     const coordinatesFromPostcode = await getLatLongFromPostcode(postcode);
    //     if (coordinatesFromPostcode) {
    //         // Set locationLat and locationLong based on the API response
    //         locationLat = coordinatesFromPostcode[1];
    //         locationLong = coordinatesFromPostcode[0];
    //         coordinates = coordinatesFromPostcode;
    //     }
    // }

    // Add to the array
    let geoData = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinates
      },
      properties: {
        id: locationID,
        postcode: postcode,
        description: locationInfo,
        arrayID: arrayID,
        dynOrder: dynOrder,
        siteType: siteType
      }
    };

    if (!mapLocations.features.some((feature) => feature.properties.id === locationID)) {
      mapLocations.features.push(geoData);
    }
  });
}

// Create a function to make an API call to get lat and long from a postcode
// async function getLatLongFromPostcode(postcode) {
//     const apiUrl = `https://api.postcode.io/postcodes/${postcode}`;
//     console.log("API URL:", apiUrl);

    
//     try {
//         const response = await fetch(apiUrl);
//         const data = await response.json();

//         if (data && data.result && data.result.latitude && data.result.longitude) {
//             return [data.result.longitude, data.result.latitude];
//         } else {
//             console.error("Invalid response from postcode.io API");
//             return null;
//         }
//     } catch (error) {
//         console.error("Error fetching data from postcode.io API:", error);
//         return null;
//     }
// }

// Invoke the getGeoData function
getGeoData();




// On load, add this data to the relevant sections
$(".locations-map_item").each(function (i) {
  let dynOrder = mapLocations.features[i].properties.dynOrder;
  let arrayID = mapLocations.features[i].properties.arrayID;

  $('.array-id-num').eq(arrayID).text(arrayID);
  $('.new-order-num').eq(arrayID).text(dynOrder);
});

// ----------- ADDING POINTS CODE BELOW -----------

// Define mapping function to be invoked later
function addMapPoints() {
  /* Add the data to your map as a layer */
  map.addLayer({
    id: "locations",
    type: "circle",
    source: {
      type: "geojson",
      data: mapLocations
    },
    paint: {
      "circle-radius": 8,
      "circle-stroke-width": 1,
      "circle-opacity": 1,
      "circle-stroke-color": "#405F3B",
      "circle-color": [
        "match",
        ["get", "siteType"],
        "IRC", "pink",
        "RSTHF", "teal",
        /* other */ "#ccc"
      ]
    }
  });

  // open a popup with the correct location
  function addPopup(e) {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = e.features[0].properties.description;

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
  }

  // When a click event occurs on a feature in the places layer, open a popup
  map.on("click", "locations", (e) => {
    var featureID = e.features[0].properties.id; // Use a unique identifier from CMS
    var dynOrder = e.features[0].properties.dynOrder;

    console.log("Feature ID: " + featureID);
    console.log("New Order: " + dynOrder);

    // Add your logic to find the corresponding CMS item using the unique identifier
    // For example, find the index in the CMS list where the item has the matching ID
    var indexInCMSList = findIndexInCMSListByID(featureID);

    // Add logic to toggle class or perform other actions based on the CMS list index
    // For example:
    if (indexInCMSList !== -1) {
        $(".location-map_card-wrap.is--selected").removeClass('is--selected');
        $('.location-map_card-wrap').eq(indexInCMSList).toggleClass('is--selected');
    }


    $("html").animate({
      scrollTop: $(".locations-map_item").eq(indexInCMSList).offset().top
    }, 800);
  });

  // Function to find the index in the CMS list based on the unique identifier
function findIndexInCMSListByID(featureID) {
    // Replace this with the actual logic to find the index
    // For example, if you have an array of CMS items with unique IDs:
    for (var i = 0; i < mapLocations.features.length; i++) {
        if (mapLocations.features[i].properties.id === featureID) {
            return i;
        }
    }
    return -1; // Return -1 if not found
}

  // Center the map on the coordinates of any clicked circle from the 'locations' layer
  map.on("click", "locations", (e) => {
    map.flyTo({
      center: e.features[0].geometry.coordinates,
      speed: 0.5,
      curve: 1,
      easing(t) {
        return t;
      }
    });
  });

  // Change the cursor to a pointer when the mouse is over the 'locations' layer
  map.on("mouseenter", "locations", () => {
    map.getCanvas().style.cursor = "pointer";
  });

  // Change it back to a pointer when it leaves
  map.on("mouseleave", "locations", () => {
    map.getCanvas().style.cursor = "";
  });
}


// When map is loaded, initialize with data
map.on("load", function (e) {
  addMapPoints();
});

// ----------- GEOCODING CODE BELOW -----------

const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: true,
  bbox: [-8.943386, 49.908511, 1.95694, 61.233906]
});

geocoder.on("result", (event) => {
  const searchResult = event.result.geometry;
  const options = { units: "miles" };

  for (const loc of mapLocations.features) {
    loc.properties.distance = turf.distance(searchResult, loc.geometry, options);
  }

  mapLocations.features.sort((a, b) => a.properties.distance - b.properties.distance);

  function updateOrderList() {
    mapLocations.features.forEach(function (location, i) {
      mapLocations.features[i].properties.dynOrder = i;
    });

    $(".locations-map_item").each(function (i) {
      let dynOrder = mapLocations.features[i].properties.dynOrder;
      let arrayID = mapLocations.features[i].properties.arrayID;

      $('.array-id-num').eq(arrayID).text(arrayID);
      $('.new-order-num').eq(arrayID).text(dynOrder);
    });

    $("html").animate({
      scrollTop: $(".locations-map_item").eq(0).offset().top
    }, 800);
  }

  updateOrderList();

  getGeoData(mapLocations);

  $(function () {
    var theContainer = $("#location-list"),
      theRows = $(".locations-map_item").get();

    theRows = theRows.sort(function (a, b) {
      var aLoc = $(".new-order-num", a).text(),
        bLoc = $(".new-order-num", b).text();
      return aLoc.localeCompare(bLoc, undefined, { numeric: true, sensitivity: 'base' });
    });

    theContainer.append(theRows);
  });
});

map.addControl(geocoder, "top-left");

// ----------- INTERACTIVITY CODE BELOW -----------

$(".locations-map_list .locations-map_item").click(function () {
  var index = $(this).index();
  var arrayID = mapLocations.features[index].properties.arrayID;
  let selectedCoords = mapLocations.features[index].geometry.coordinates;
  let description = mapLocations.features[index].properties.description;

  if ($(".location-map_card-wrap.is--selected").length) {
    $(".location-map_card-wrap").removeClass('is--selected');
  }

  $('.location-map_card-wrap').eq(index).toggleClass('is--selected');

  map.flyTo({
    center: selectedCoords,
    speed: 4,
    curve: 1,
    zoom: 14,
    easing(t) {
      return t;
    }
  });

  const popup = new mapboxgl.Popup()
    .setLngLat(selectedCoords)
    .setHTML(description);

  const popups = document.getElementsByClassName("mapboxgl-popup");
  if (popups.length) {
    popups[0].remove();
  }

  popup.addTo(map);
});

// Set hover popup
const popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false
});

map.on("mouseenter", "locations", (e) => {
  map.getCanvas().style.cursor = "pointer";

  const coordinates = e.features[0].geometry.coordinates.slice();
  const description = e.features[0].properties.description;

  while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
  }

  popup.setLngLat(coordinates).setHTML(description).addTo(map);
});

map.on("mouseleave", "locations", () => {
  map.getCanvas().style.cursor = "";
  popup.remove();
});
