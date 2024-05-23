// ----------- MAPBOX SETUP CODE BELOW -----------
mapboxgl.accessToken =
  "pk.eyJ1IjoiY29tbW9ua25vd2xlZGdlIiwiYSI6ImNqc3Z3NGZxcDA4NGo0OXA2dzd5eDJvc2YifQ.f68VZ1vlc6s3jg3JgShd0A";

// Create empty locations GeoJSON object
let mapLocations = {
  type: "FeatureCollection",
  features: [],
};
let selectedMapLocations = [];
let map = new mapboxgl.Map({
  container: "map",
  //style: "mapbox://styles/mapbox/light-v11",
  style: "mapbox://styles/commonknowledge/clqfcx8dc00i301nw55apf380/draft",
  center: [-3.205, 54.437],
  zoom: 5.36,
});
let listLocations;
let numLocations = document.getElementById("location-list").childNodes.length;

// Adjust zoom of map for mobile and desktop
let mq = window.matchMedia("(min-width: 480px)");
map.setZoom(mq.matches ? 5.36 : 4.8);

// Add zoom and rotation controls to the map
map.addControl(new mapboxgl.NavigationControl());

// ----------- GEOCODING CODE BELOW -----------
const geocoder = new MapboxGeocoder({
  accessToken: mapboxgl.accessToken,
  mapboxgl: mapboxgl,
  marker: true,
  bbox: [-8.943386, 49.908511, 1.95694, 61.233906],
});

// Set hover popup
const popup = new mapboxgl.Popup({
  closeButton: false,
  closeOnClick: false,
});

geocoder.on("result", (event) => {
  const searchResult = event.result.geometry;
  const options = { units: "miles" };

  for (const loc of mapLocations.features) {
    loc.properties.distance = turf.distance(
      searchResult,
      loc.geometry,
      options
    );
  }

  mapLocations.features.sort(
    (a, b) => a.properties.distance - b.properties.distance
  );

  function updateOrderList() {
    mapLocations.features.forEach(function (location, i) {
      mapLocations.features[i].properties.dynOrder = i;
    });

    $(".locations-map_item").each(function (i) {
      let dynOrder = mapLocations.features[i].properties.dynOrder;
      let arrayID = mapLocations.features[i].properties.arrayID;

      $(".array-id-num").eq(arrayID).text(arrayID);
      $(".dyn-order-num").eq(arrayID).text(dynOrder);
    });

    $("html").animate(
      {
        scrollTop: $(".locations-map_item").eq(0).offset().top,
      },
      800
    );
  }

  updateOrderList();

  getGeoData();

  $(function () {
    var theContainer = $("#location-list"),
      theRows = $(".locations-map_item").get();

    theRows = theRows.sort(function (a, b) {
      var aLoc = $(".dyn-order-num", a).text(),
        bLoc = $(".dyn-order-num", b).text();
      return aLoc.localeCompare(bLoc, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    theContainer.append(theRows);
  });
});

map.addControl(geocoder, "top-left");

// Mutation observer
var targetNode = document.getElementById("location-list");
const config = { childList: true, subTree: false };
const callback = function (mutationsList, observer) {
  if (
    numLocations !== document.getElementById("location-list").childNodes.length
  ) {
    populateMap();
  }
  numLocations = document.getElementById("location-list").childNodes.length;
};
const observer = new MutationObserver(callback);
observer.observe(targetNode, config);

// When map is loaded, initialize with data
map.on("load", function (e) {
  populateMap();
});

async function populateMap() {
  mapLocations = {
    type: "FeatureCollection",
    features: [],
  };
  selectedMapLocations = [];
  listLocations = [];

  // ----------- WEBFLOW CMS CODE BELOW -----------

  // Get CMS items
  listLocations = document.getElementById("location-list").childNodes;

  await getGeoData(listLocations, mapLocations);

  // On load, add this data to the relevant sections
  $(".locations-map_item").each(function (i) {
    let dynOrder = mapLocations.features[i].properties.dynOrder;
    let arrayID = mapLocations.features[i].properties.arrayID;

    $("#array-id-num").eq(arrayID).text(arrayID);
    $("#dyn-order-num").eq(arrayID).text(dynOrder);
  });

  // ----------- ADDING POINTS CODE BELOW -----------
  // When map is loaded, initialize with data
  addMapPoints();
}

// For each collection item, grab hidden fields and convert to GeoJSON property
async function getGeoData() {
  listLocations.forEach(async function (location, i) {
    let locationLat = location.querySelector("#locationLatitude").value;
    let locationLong = location.querySelector("#locationLongitude").value;

    //let locationLong = location.querySelector("#locationLongitude").value;
    let locationInfo = location.querySelector(".locations-map_card").innerHTML;
    let siteType = location.querySelector(".sitetype").innerHTML;
    let coordinates = [locationLong, locationLat];
    let locationID = location.querySelector("#locationID").value;

    // This is so every item has an initial ID
    let arrayID = i;
    // This is the dyn Order of the CMS items if geocoding is used
    let dynOrder = i;

    // Add to the array
    let geoData = {
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: coordinates,
      },
      properties: {
        id: locationID,
        description: locationInfo,
        arrayID: arrayID,
        dynOrder: dynOrder,
        siteType: siteType,
      },
    };

    if (
      !mapLocations.features.some(
        (feature) => feature.properties.id === locationID
      )
    ) {
      mapLocations.features.push(geoData);
    }
  });
}

// Define mapping function to be invoked later
function addMapPoints() {
  let nodeColors = [
    "match",
    ["get", "siteType"] /* Name of options in cms
      /* Name of options in cms, color */,
    "Immigration Removal Centre",
    "#2D19A9",
    "Short Term Holding Facility",
    "#57B598",
    "Prison",
    "#FFE27A",
    /* other */ "#ccc",
  ];

  /* Add the data to your map as a layer */

  try {
    $(".locations-map_list .locations-map_item").off("click");
    map.off("click", "locations");
    map.off("mouseenter", "locations");
    map.off("mouseleave", "locations");
    map.removeLayer("locations");
    map.removeSource("locations");
  } catch (e) {
    console.log("Layer not found");
  }
  map.addLayer({
    id: "locations",
    type: "circle",
    source: {
      type: "geojson",
      data: mapLocations,
    },
    paint: {
      "circle-radius": 8,
      "circle-stroke-width": 3,
      "circle-stroke-opacity": 0.4,
      "circle-opacity": 1,
      "circle-stroke-color": "white",
      "circle-color": nodeColors,
    },
  });

  // ----------- INTERACTIVITY CODE BELOW -----------
  $(".locations-map_list .locations-map_item").click(function () {
    var index = $(this).index();
    var arrayID = mapLocations.features[index].properties.arrayID;
    let selectedCoords = mapLocations.features[index].geometry.coordinates;
    let description = mapLocations.features[index].properties.description;

    if ($(".location-map_card-wrap.is--selected").length) {
      $(".location-map_card-wrap").removeClass("is--selected");
    }

    $(".location-map_card-wrap").eq(index).toggleClass("is--selected");

    map.flyTo({
      center: selectedCoords,
      speed: 4,
      curve: 1,
      zoom: 14,
      easing(t) {
        return t;
      },
    });

    const popup = new mapboxgl.Popup({ focusAfterOpen: false })
      .setLngLat(selectedCoords)
      .setHTML(description);

    const popups = document.getElementsByClassName("mapboxgl-popup");
    if (popups.length) {
      popups[0].remove();
    }

    popup.addTo(map);
  });

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
      $(".location-map_card-wrap.is--selected").removeClass("is--selected");
      $(".location-map_card-wrap")
        .eq(indexInCMSList)
        .toggleClass("is--selected");
    }

    $("html").animate(
      {
        scrollTop: $(".locations-map_item").eq(indexInCMSList).offset().top,
      },
      800
    );
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
}
