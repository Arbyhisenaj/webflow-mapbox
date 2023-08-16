//-----------MAPBOX SETUP CODE BELOW-----------
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!! REPLACE ACCESS TOKEN WITH YOURS HERE !!!
mapboxgl.accessToken =
    "pk.eyJ1IjoiY29tbW9ua25vd2xlZGdlIiwiYSI6ImNqc3Z3NGZxcDA4NGo0OXA2dzd5eDJvc2YifQ.f68VZ1vlc6s3jg3JgShd0A";
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


// create empty locations geojson object
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
if (mq.matches) {
    map.setZoom(5.36); //set map zoom level for desktop size
} else {
    map.setZoom(4.8); //set map zoom level for mobile size
}

// Add zoom and rotation controls to the map.
map.addControl(new mapboxgl.NavigationControl());



//-----------WEBFLOW CMS CODE BELOW-----------


// Get cms items
let listLocations = document.getElementById("location-list").childNodes;

// For each colleciton item, grab hidden fields and convert to geojson proerty
// !! This will need adjusting for every project
function getGeoData() {
    listLocations.forEach(function (location, i) {
        let locationLat = location.querySelector("#locationLatitude").value;
        let locationLong = location.querySelector("#locationLongitude").value;
        let locationInfo = location.querySelector(".locations-map_card").innerHTML;
        let siteType = location.querySelector(".sitetype").innerHTML;
        let coordinates = [locationLong, locationLat];
        let locationID = location.querySelector("#locationID").value;
        
        //this is so every item has an initial ID 
        let arrayID = i + 1 - 1;
        //this is the new order of the cms items if geocoding is used
        let newOrder = "";

        //add to the array
        let geoData = {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: coordinates
            },
            properties: {
                id: locationID,
                description: locationInfo,
                arrayID: arrayID,
                newOrder: newOrder,
                siteType: siteType
            }
        };

        if (mapLocations.features.includes(geoData) === false) {
            mapLocations.features.push(geoData);
        }
    });
}
console.log(mapLocations.features)

// Invoke function
getGeoData();




//-----------ADDING POINTS CODE BELOW-----------


// define mapping function to be invoked later
function addMapPoints() {
    /* Add the data to your map as a layer */
    map.addLayer({
        id: "locations",
        type: "circle",
        /* Add a GeoJSON source containing place coordinates and information. */
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
                "IRC",
                "pink",
                "RSTHF",
                "teal",
        /* other */ "#ccc"
            ]
        }
    });

    // open a popup with the correct location
    function addPopup(e) {
        // Copy coordinates array.
        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.description;

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        new mapboxgl.Popup().setLngLat(coordinates).setHTML(description).addTo(map);
    }

    // When a click event occurs on a feature in the places layer, open a popup at the
    // location of the feature, with description HTML from its properties.

    map.on("click", "locations", (e) => {
        //find ID of collection item in array
        const ID = e.features[0].properties.newOrder;
        const newOrder = e.features[0].properties.newOrder;
        console.log(ID);
        console.log(newOrder)

        //add popup
        addPopup(e);
        //show webflow Collection module
        $(".locations-map_wrapper").addClass("is--active");

        //Check if an item is currently there
        if ($(".location-map_card-wrap.is--selected").length) {
            $(".location-map_card-wrap").removeClass('is--selected');
        }
        //find collection item by array ID and show it
        $('.location-map_card-wrap').eq(ID).toggleClass('is--selected');

        // Scroll to the cms item on page
        $("html").animate(
            {
                scrollTop: $(".locations-map_item").eq(ID).offset().top
            },
            800 //speed
        );
    });

    // Center the map on the coordinates of any clicked circle from the 'locations' layer.
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

    // Change the cursor to a pointer when the mouse is over the 'locations' layer.
    map.on("mouseenter", "locations", () => {
        map.getCanvas().style.cursor = "pointer";
    });

    // Change it back to a pointer when it leaves.
    map.on("mouseleave", "locations", () => {
        map.getCanvas().style.cursor = "";
    });
}

//When map is loaded initialize with data
map.on("load", function (e) {
    addMapPoints();
});


//-----------GEOCODING CODE BELOW-----------


const geocoder = new MapboxGeocoder({
    accessToken: mapboxgl.accessToken, // Set the access token
    mapboxgl: mapboxgl, // Set the mapbox-gl instance
    marker: true, // Use the geocoder's default marker style
    bbox: [-8.943386, 49.908511, 1.95694, 61.233906] // Set the bounding box coordinates
});

geocoder.on("result", (event) => {
    const searchResult = event.result.geometry;
    console.log(searchResult);
    // Use Turf to measure distances between the place user searched and items in the cms
    const options = { units: "miles" };
    for (const loc of mapLocations.features) {
        loc.properties.distance = turf.distance(
            searchResult,
            loc.geometry,
            options
        );
    }
    // Order the list based on promixity
    mapLocations.features.sort((a, b) => {
        if (a.properties.distance > b.properties.distance) {
            return 1;
        }
        if (a.properties.distance < b.properties.distance) {
            return -1;
        }
        return 0; // a must be equal to b

    });

    getGeoData(mapLocations);


    // Function that updates the order of cms items and scrolls user back to the top

    function updateOrderList() {


        mapLocations.features.forEach(function (location, i) {

            mapLocations.features[i].properties.newOrder = i

        })

        console.log(mapLocations.features)

    
        


        //adding the new order number to a hidden text field in the location items that can be used to s


        $(".locations-map_item").each(function (i) {

            let newOrder = mapLocations.features[i].properties.newOrder
            let arrayID = mapLocations.features[i].properties.arrayID


            $('.array-id-num').eq(arrayID).text(arrayID);
            $('.new-order-num').eq(arrayID).text(newOrder);


        });


        //Scrolls back to the top

        $("html").animate(
            {
                scrollTop: $(".locations-map_item").eq(0).offset().top
            },
            800 //speed
        );


        //using that text field to sort the items

    }

    // 
    $(function () {
        var theContainer = $("#location-list"), // You could use body if all the rows are children of body
            theRows = $(".locations-map_item").get() // an array


        theRows = theRows.sort(function (a, b) {
            var aLoc = $(".new-order-num", a).text(),
                bLoc = $(".new-order-num", b).text()
            return aLoc.localeCompare(bLoc, undefined, {numeric: true, sensitivity: 'base'})
            //return aLoc < bLoc ? -1 : aLoc > bLoc ? 1 : -1
        })
        theContainer.append(theRows)
    })
    updateOrderList()


});

map.addControl(geocoder, "top-left");



//-----------INTERACTIVITY CODE BELOW-----------


//Centring map with clicking on csm item



$(".locations-map_list .locations-map_item").click(function () {
    var index = $(this).index();
    var arrayID = mapLocations.features[index].properties.arrayID;
    console.log(index);
    let selectedCoords = mapLocations.features[index].geometry.coordinates;
    let description = mapLocations.features[index].properties.description;

     //Check if an item is currently there
     if ($(".location-map_card-wrap.is--selected").length) {
        $(".location-map_card-wrap").removeClass('is--selected');
    }
    //find collection item by array ID and show it
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


//////////hover stuff

//set hover popup
const popup = new mapboxgl.Popup({
    closeButton: false,
    closeOnClick: false
});

map.on("mouseenter", "locations", (e) => {
    // Change the cursor style as a UI indicator.
    map.getCanvas().style.cursor = "pointer";

    // Copy coordinates array.
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = e.features[0].properties.description;

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    // Populate the popup and set its coordinates
    // based on the feature found.
    popup.setLngLat(coordinates).setHTML(description).addTo(map);

    
});

map.on("mouseleave", "locations", () => {
    map.getCanvas().style.cursor = "";
    popup.remove();
});
