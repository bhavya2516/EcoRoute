// ===============================
// Google Maps Globals
// ===============================
let map;
let directionsService;
let ecoRenderer;
let normalRenderer;

// Emission factor (grams CO₂ per km)
const EMISSION_FACTOR = {
  diesel: 270,
  petrol: 210,
  electric: 50
};

// ===============================
// Initialize Google Map
// ===============================
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 7,
    center: { lat: 12.9716, lng: 77.5946 } // Bengaluru
  });

  directionsService = new google.maps.DirectionsService();

  // 🟢 ECO FRIENDLY ROUTE (GREEN)
  ecoRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: false,
    polylineOptions: {
      strokeColor: "#2e7d32",
      strokeWeight: 7
    }
  });

  // 🔴 NORMAL / HIGH EMISSION ROUTE (RED)
  normalRenderer = new google.maps.DirectionsRenderer({
    map: map,
    suppressMarkers: true,
    polylineOptions: {
      strokeColor: "#d32f2f",
      strokeWeight: 5
    }
  });
}

// ===============================
// Main Function
// ===============================
function calculateRoute() {
  const start = document.getElementById("start").value.trim();
  const end = document.getElementById("end").value.trim();

  if (!start || !end) {
    showResult("⚠️ Please enter both start and destination locations.", "warning");
    return;
  }

  showResult("⏳ Fetching real routes and calculating emissions...", "loading");

  const request = {
    origin: start,
    destination: end,
    travelMode: google.maps.TravelMode.DRIVING,
    provideRouteAlternatives: true
  };

  directionsService.route(request, (result, status) => {
    if (status !== "OK") {
      showResult("❌ Google Maps error: " + status, "error");
      return;
    }

    let bestIndex = 0;
    let lowestEmission = Infinity;

    // ---------------------------------
    // Evaluate emissions for all routes
    // ---------------------------------
    result.routes.forEach((route, index) => {
      const distanceKm = route.legs[0].distance.value / 1000;
      const durationMin = route.legs[0].duration.value / 60;

      // Traffic factor approximation
      const trafficFactor = 1 + durationMin / 120;

      const emission =
        distanceKm * EMISSION_FACTOR.diesel * trafficFactor;

      if (emission < lowestEmission) {
        lowestEmission = emission;
        bestIndex = index;
      }
    });

    // ---------------------------------
    // CLEAR PREVIOUS ROUTES
    // ---------------------------------
    ecoRenderer.setDirections(null);
    normalRenderer.setDirections(null);

    // ---------------------------------
    // DRAW ECO ROUTE (GREEN)
    // ---------------------------------
    ecoRenderer.setDirections(result);
    ecoRenderer.setRouteIndex(bestIndex);

    // ---------------------------------
    // DRAW NORMAL ROUTE (RED)
    // ---------------------------------
    const normalIndex = bestIndex === 0 ? 1 : 0;

    if (result.routes[normalIndex]) {
      normalRenderer.setDirections(result);
      normalRenderer.setRouteIndex(normalIndex);
    }

    // ---------------------------------
    // DISPLAY RESULT
    // ---------------------------------
    const bestRoute = result.routes[bestIndex];
    const distanceKm = bestRoute.legs[0].distance.value / 1000;
    const durationMin = bestRoute.legs[0].duration.value / 60;

    displayResult(distanceKm, durationMin, lowestEmission);
  });
}

// ===============================
// Display Result
// ===============================
function displayResult(distance, duration, emission) {
  const resultHTML = `
    ✅ <strong>Eco-Friendly Route Selected</strong><br><br>

    🚗 <b>Vehicle:</b> Diesel<br>
    📏 <b>Distance:</b> ${distance.toFixed(2)} km<br>
    ⏱️ <b>Duration:</b> ${duration.toFixed(1)} min<br><br>

    🌿 <b>Estimated CO₂ Emissions:</b> ${emission.toFixed(2)} g<br><br>

    🟢 <b>Green path:</b> Low carbon (Eco-friendly)<br>
    🔴 <b>Red path:</b> Higher emissions
  `;

  showResult(resultHTML, "success");
}

// ===============================
// UI Result Handler
// ===============================
function showResult(message, type) {
  const resultBox = document.getElementById("result");
  resultBox.style.display = "block";

  const styles = {
    success: ["#e8f5e9", "#4caf50"],
    warning: ["#fff8e1", "#ff9800"],
    error: ["#ffebee", "#f44336"],
    loading: ["#eef3ef", "#2e7d32"]
  };

  const [bg, border] = styles[type] || styles.loading;

  resultBox.style.background = bg;
  resultBox.style.borderLeft = `5px solid ${border}`;
  resultBox.innerHTML = message;
}
