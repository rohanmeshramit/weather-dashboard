// Note: Replace with your own API key from openweathermap.org
const API_KEY = "24bbce2f1586cebe7ad9feb115dde67c";

let hourlyChart = null;
const alertBanner = document.getElementById("alert-banner");
const alertMessage = document.getElementById("alert-message");
const searchHistory = document.getElementById("search-history");
const searchBtn = document.getElementById("search-btn");
const cityInput = document.getElementById("city-input");
const weatherDisplay = document.getElementById("weather-display");
const forecastContainer = document.getElementById("forecast-container");

searchBtn.addEventListener("click", function () {
  const city = cityInput.value.trim();
  if (city === "") {
    weatherDisplay.innerHTML = "<p>Please enter a city name.</p>";
    return;
  }
  getWeather(city);
});

cityInput.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    const city = cityInput.value.trim();
    if (city === "") {
      weatherDisplay.innerHTML = "<p>Please enter a city name.</p>";
      return;
    }
    getWeather(city);
  }
});

async function getWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== 200) {
      weatherDisplay.innerHTML = "<p>City not found. Please try again.</p>";
      return;
    }

    const name = data.name;
    saveToHistory(city);
    const country = data.sys.country;
    const temp = Math.round(data.main.temp);
    const feels = Math.round(data.main.feels_like);
    const humidity = data.main.humidity;
    const wind = data.wind.speed;
    const condition = data.weather[0].description;
    checkWeatherAlert(condition, temp);
    const icon = data.weather[0].icon;
    const visibility = (data.visibility / 1000).toFixed(1);
    const conditionFormatted = condition.charAt(0).toUpperCase() + condition.slice(1);
    const now = new Date();
    const dateString = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
    setDayNightMode(data.sys.sunrise, data.sys.sunset);

    weatherDisplay.style.animation = "none";
    weatherDisplay.offsetHeight;
    weatherDisplay.style.animation = "fadeIn 0.5s ease";
    weatherDisplay.innerHTML = `
      <h2>${name}, ${country}</h2>
      <p class="date-text">${dateString}</p>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="weather icon" />
      <div class="big-temp">${temp}°C</div>
      <p class="condition-text">${conditionFormatted}</p>
      <div class="weather-grid">
        <div class="weather-grid-item">🌡️ Feels like: ${feels}°C</div>
        <div class="weather-grid-item">💧 Humidity: ${humidity}%</div>
        <div class="weather-grid-item">💨 Wind: ${wind} m/s</div>
        <div class="weather-grid-item">👁️ Visibility: ${visibility} km</div>
      </div>
    `;

    getForecast(city);
    getHourlyForecast(city);
  } catch (error) {
    weatherDisplay.innerHTML = "<p>Something went wrong. Please try again.</p>";
  }
}

async function getLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async function (position) {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;

      try {
        const response = await fetch(url);
        const data = await response.json();

        const name = data.name;
        const country = data.sys.country;
        const temp = Math.round(data.main.temp);
        const feels = Math.round(data.main.feels_like);
        const humidity = data.main.humidity;
        const wind = data.wind.speed;
        const condition = data.weather[0].description;
        checkWeatherAlert(condition, temp);
        const icon = data.weather[0].icon;
        const visibility = (data.visibility / 1000).toFixed(1);
        const conditionFormatted = condition.charAt(0).toUpperCase() + condition.slice(1);
        const now = new Date();
        const dateString = now.toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });
        setDayNightMode(data.sys.sunrise, data.sys.sunset);

        weatherDisplay.style.animation = "none";
        weatherDisplay.offsetHeight;
        weatherDisplay.style.animation = "fadeIn 0.5s ease";
        weatherDisplay.innerHTML = `
          <h2>${name}, ${country}</h2>
          <p class="date-text">${dateString}</p>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="weather icon" />
          <div class="big-temp">${temp}°C</div>
          <p class="condition-text">${conditionFormatted}</p>
          <div class="weather-grid">
            <div class="weather-grid-item">🌡️ Feels like: ${feels}°C</div>
            <div class="weather-grid-item">💧 Humidity: ${humidity}%</div>
            <div class="weather-grid-item">💨 Wind: ${wind} m/s</div>
            <div class="weather-grid-item">👁️ Visibility: ${visibility} km</div>
          </div>
        `;

        getForecast(data.name);
        getHourlyForecast(data.name);
      } catch (error) {
        weatherDisplay.innerHTML = "<p>Something went wrong. Please try again.</p>";
      }
    });
  }
}

getLocationWeather();
displayHistory();

async function getForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== "200") {
      forecastContainer.innerHTML = "";
      return;
    }

    const dailyForecasts = data.list.filter(item =>
      item.dt_txt.includes("12:00:00")
    );

    forecastContainer.innerHTML = dailyForecasts.map(day => {
      const date = new Date(day.dt_txt);
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const temp = Math.round(day.main.temp);
      const icon = day.weather[0].icon;
      const condition = day.weather[0].description;

      return `
        <div class="forecast-card">
          <p>${dayName}</p>
          <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="icon" />
          <p>${temp}°C</p>
          <p>${condition}</p>
        </div>
      `;
    }).join("");

  } catch (error) {
    forecastContainer.innerHTML = "";
  }
}

function saveToHistory(city) {
  let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  history = history.filter(item => item.toLowerCase() !== city.toLowerCase());
  history.unshift(city);
  history = history.slice(0, 5);
  localStorage.setItem("searchHistory", JSON.stringify(history));
  displayHistory();
}

function displayHistory() {
  let history = JSON.parse(localStorage.getItem("searchHistory")) || [];
  searchHistory.innerHTML = history.map(city => `
    <button class="history-btn" onclick="getWeather('${city}')">${city.charAt(0).toUpperCase() + city.slice(1)}</button>
  `).join("");
}

async function getHourlyForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== "200") return;

    const next24hours = data.list.slice(0, 8);

    const labels = next24hours.map(item => {
      const date = new Date(item.dt_txt);
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    });

    const temps = next24hours.map(item => Math.round(item.main.temp));

    if (hourlyChart) {
      hourlyChart.destroy();
    }

    const ctx = document.getElementById("hourly-chart").getContext("2d");
    hourlyChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [{
          label: "Temperature (°C)",
          data: temps,
          borderColor: "#e94560",
          backgroundColor: "rgba(233, 69, 96, 0.1)",
          borderWidth: 2,
          pointBackgroundColor: "#e94560",
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: { color: "white" }
          }
        },
        scales: {
          x: {
            ticks: { color: "white" },
            grid: { color: "rgba(255,255,255,0.1)" }
          },
          y: {
            ticks: { color: "white" },
            grid: { color: "rgba(255,255,255,0.1)" }
          }
        }
      }
    });

  } catch (error) {
    console.log("Chart error:", error);
  }
}

function checkWeatherAlert(condition, temp) {
  const c = condition.toLowerCase();

  if (c.includes("thunderstorm")) {
    alertMessage.textContent = "Thunderstorm warning — stay indoors";
    alertBanner.classList.remove("hidden");
  } else if (c.includes("rain") || c.includes("drizzle")) {
    alertMessage.textContent = "Heavy rain expected — carry an umbrella";
    alertBanner.classList.remove("hidden");
  } else if (c.includes("snow")) {
    alertMessage.textContent = "Snowfall alert — roads may be slippery";
    alertBanner.classList.remove("hidden");
  } else if (temp > 40) {
    alertMessage.textContent = "Extreme heat warning — stay hydrated";
    alertBanner.classList.remove("hidden");
  } else if (c.includes("haze") || c.includes("fog") || c.includes("smoke")) {
    alertMessage.textContent = "Poor visibility — drive carefully";
    alertBanner.classList.remove("hidden");
  } else {
    alertBanner.classList.add("hidden");
  }
}

function setDayNightMode(sunrise, sunset) {
  const now = Math.floor(Date.now() / 1000);

  if (now >= sunrise && now < sunset) {
    document.body.classList.remove("night-mode");
    document.body.classList.add("day-mode");
  } else {
    document.body.classList.remove("day-mode");
    document.body.classList.add("night-mode");
  }
}