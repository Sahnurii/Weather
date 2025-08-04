const apiKey = "c680ee4fbbfe42f20c8ae98ff871699e"; // Ganti dengan API key Anda

// Seleksi Elemen DOM
const tempElement = document.querySelector('.temp');
const locationElement = document.querySelector('.location');
const datetimeElement = document.querySelector('.datetime');
const weatherIconElement = document.querySelector('.weather-icon');
const weatherDescriptionElement = document.querySelector('.weather-description');
const searchInput = document.querySelector('.search input');
const searchButton = document.querySelector('.search button');
const errorMessageElement = document.querySelector('.error-message');
const suggestionsBox = document.querySelector('.suggestions-box');

let allCities = []; // Untuk menyimpan data kota dari kota.json

const weatherDetails = {
    description: document.querySelector('.weather-details p'),
    tempMax: document.querySelector('.weather-details ul li:nth-child(1)'),
    tempMin: document.querySelector('.weather-details ul li:nth-child(2)'),
    humidity: document.querySelector('.weather-details ul li:nth-child(3)'),
    cloudy: document.querySelector('.weather-details ul li:nth-child(4)'),
    wind: document.querySelector('.weather-details ul li:nth-child(5)'),
    aqi: document.querySelector('.weather-details ul li:nth-child(6)'),
    sunrise: document.querySelector('.weather-details ul li:nth-child(7)'),
    sunset: document.querySelector('.weather-details ul li:nth-child(8)'),
};

// Fungsi untuk mendapatkan data kualitas udara (AQI)
async function getAirQuality(lat, lon) {
    const url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Gagal mendapatkan data kualitas udara.');
        }
        const data = await response.json();
        updateAQIUI(data);
    } catch (error) {
        console.error("Error fetching AQI data:", error);
        weatherDetails.aqi.innerHTML = `<img src="icons/cloud/cloud.svg" /> AQI: N/A`;
    }
}

// Fungsi untuk memperbarui UI kualitas udara (AQI)
function updateAQIUI(data) {
    const aqiValue = data.list[0].main.aqi;
    let aqiDescription = '';

    switch (aqiValue) {
        case 1:
            aqiDescription = 'Baik';
            break;
        case 2:
            aqiDescription = 'Cukup';
            break;
        case 3:
            aqiDescription = 'Sedang';
            break;
        case 4:
            aqiDescription = 'Buruk';
            break;
        case 5:
            aqiDescription = 'Sangat Buruk';
            break;
        default:
            aqiDescription = 'N/A';
    }
    weatherDetails.aqi.innerHTML = `<img src="icons/lungs.svg" /> AQI: ${aqiValue} (${aqiDescription})`;
}

// Fungsi untuk mendapatkan data cuaca
function displayError(message) {
    errorMessageElement.textContent = message;
    errorMessageElement.classList.add('show');
    setTimeout(() => {
        errorMessageElement.classList.remove('show');
    }, 5000); // Sembunyikan setelah 5 detik
}

// Fungsi untuk mendapatkan data cuaca
async function getWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Kota tidak ditemukan: ${city}`);
        }
        const data = await response.json();
        updateUI(data);
        getForecast(city);
    } catch (error) {
        console.error("Error fetching weather data:", error);
        displayError(error.message);
        // Ensure the app container is visible even if weather data fetching fails
        document.querySelector('.app-container').classList.add('loaded');
    }
}

// Fungsi untuk mendapatkan data prakiraan cuaca
async function getForecast(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Data prakiraan tidak ditemukan untuk: ${city}`);
        }
        const data = await response.json();
        updateForecastUI(data);
    } catch (error) {
        console.error("Error fetching forecast data:", error);
    }
}

// Fungsi untuk memperbarui UI prakiraan cuaca
function updateForecastUI(data) {
    const forecastContainer = document.querySelector('.forecast-items');
    forecastContainer.innerHTML = ''; // Kosongkan kontainer

    const dailyForecasts = {};

    // Kelompokkan prakiraan berdasarkan hari
    data.list.forEach(item => {
        const date = item.dt_txt.split(' ')[0]; // Ambil bagian tanggal saja
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = item;
        }
    });

    // Ubah objek menjadi array dan tampilkan
    Object.values(dailyForecasts).slice(0, 5).forEach(day => { // Tampilkan maks 5 hari
        const forecastItem = document.createElement('div');
        forecastItem.classList.add('forecast-item');

        const dayName = new Date(day.dt * 1000).toLocaleDateString('id-ID', { weekday: 'long' });
        const icon = getWeatherIcon(day.weather[0].icon);
        const tempMax = `${Math.round(day.main.temp_max)}°`;
        const tempMin = `${Math.round(day.main.temp_min)}°`;

        forecastItem.innerHTML = `
            <span class="day">${dayName}</span>
            <span class="icon">${icon}</span>
            <span class="temp-max">${tempMax}</span>
            <span class="temp-min">${tempMin}</span>
        `;

        forecastContainer.appendChild(forecastItem);
    });

    // Perbarui UI prakiraan per jam
    updateHourlyForecastUI(data.list);
}

// Fungsi untuk memperbarui UI prakiraan per jam
function updateHourlyForecastUI(hourlyData) {
    const hourlyForecastContainer = document.querySelector('.hourly-forecast-items');
    hourlyForecastContainer.innerHTML = ''; // Kosongkan kontainer

    // Tampilkan beberapa prakiraan per jam (misalnya, 8 item pertama)
    hourlyData.slice(0, 8).forEach(item => {
        const hourlyItem = document.createElement('div');
        hourlyItem.classList.add('hourly-forecast-item');

        const time = new Date(item.dt * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const icon = getWeatherIcon(item.weather[0].icon);
        const temp = `${Math.round(item.main.temp)}°`;

        hourlyItem.innerHTML = `
            <span class="time">${time}</span>
            <span class="icon">${icon}</span>
            <span class="temp">${temp}</span>
        `;
        hourlyForecastContainer.appendChild(hourlyItem);
    });
}

const favoriteCitiesList = document.querySelector('.favorite-cities-list');

// Fungsi untuk menyimpan kota favorit
function saveFavoriteCity(city) {
    let favorites = JSON.parse(localStorage.getItem('favoriteCities')) || [];
    if (!favorites.includes(city)) {
        favorites.push(city);
        localStorage.setItem('favoriteCities', JSON.stringify(favorites));
        renderFavoriteCities();
    }
}

// Fungsi untuk menghapus kota favorit
function removeFavoriteCity(cityToRemove) {
    let favorites = JSON.parse(localStorage.getItem('favoriteCities')) || [];
    favorites = favorites.filter(city => city !== cityToRemove);
    localStorage.setItem('favoriteCities', JSON.stringify(favorites));
    renderFavoriteCities();
}

// Fungsi untuk menampilkan kota favorit di UI
function renderFavoriteCities() {
    favoriteCitiesList.innerHTML = ''; // Kosongkan daftar
    let favorites = JSON.parse(localStorage.getItem('favoriteCities')) || [];

    favorites.forEach(city => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${city}</span>
            <button class="delete-btn">&times;</button>
        `;
        listItem.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                getWeather(city);
            }
        });
        listItem.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation(); // Mencegah event click pada li
            removeFavoriteCity(city);
        });
        favoriteCitiesList.appendChild(listItem);
    });
}

// Fungsi untuk memperbarui UI
function updateUI(data) {
    // Bagian Utama
    tempElement.textContent = `${Math.round(data.main.temp)}°`;
    locationElement.textContent = data.name;
    datetimeElement.textContent = getFormattedDateTime();
    weatherIconElement.innerHTML = getWeatherIcon(data.weather[0].icon);
    weatherDescriptionElement.textContent = data.weather[0].description.toUpperCase();

    // Detail Cuaca
    weatherDetails.description.textContent = data.weather[0].description.toUpperCase();
    weatherDetails.tempMax.innerHTML = `<img src="icons/temperature-high.svg" /> Temp max: ${Math.round(data.main.temp_max)}°`;
    weatherDetails.tempMin.innerHTML = `<img src="icons/temperature-low.svg" /> Temp min: ${Math.round(data.main.temp_min)}°`;
    weatherDetails.humidity.innerHTML = `<img src="icons/humidity.png" /> Humidity: ${data.main.humidity}%`;
    weatherDetails.cloudy.innerHTML = `<img src="icons/cloud/cloud.svg" /> Cloudy: ${data.clouds.all}%`;
    weatherDetails.wind.innerHTML = `<img src="icons/wind.svg" /> Wind: ${data.wind.speed.toFixed(1)}km/h`;

    // Waktu Matahari Terbit & Terbenam
    const sunriseTime = new Date(data.sys.sunrise * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const sunsetTime = new Date(data.sys.sunset * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    weatherDetails.sunrise.innerHTML = `<img src="icons/sunrise.svg" /> Sunrise: ${sunriseTime}`;
    weatherDetails.sunset.innerHTML = `<img src="icons/sunset.svg" /> Sunset: ${sunsetTime}`;

    // Perbarui Latar Belakang
    updateBackground(data.weather[0].icon);

    // Dapatkan dan perbarui Kualitas Udara (AQI)
    getAirQuality(data.coord.lat, data.coord.lon);

    // Tampilkan konten dengan transisi
    document.querySelector('.app-container').classList.add('loaded');

    // Simpan kota saat ini sebagai favorit
    saveFavoriteCity(data.name);
}

// Fungsi untuk format tanggal dan waktu
function getFormattedDateTime() {
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'short', year: '2-digit' };
    const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const date = now.toLocaleDateString('en-GB', options).replace(/,/g, '');
    return `${time} - ${date}`;
}

// Fungsi untuk mendapatkan ikon cuaca
function getWeatherIcon(iconCode) {
    const iconMap = {
        '01d': 'icons/sun.svg', 
        '01n': 'icons/moon.svg',
        '02d': 'icons/cloud/cloud.svg',
        '02n': 'icons/cloud/cloud.svg',
        '03d': 'icons/cloud/cloud.svg',
        '03n': 'icons/cloud/cloud.svg',
        '04d': 'icons/cloud/cloud.svg',
        '04n': 'icons/cloud/cloud.svg',
        '09d': 'icons/cloud/cloud-drizzle.svg',
        '09n': 'icons/cloud/cloud-drizzle.svg',
        '10d': 'icons/cloud/cloud-rain.svg',
        '10n': 'icons/cloud/cloud-rain.svg',
        '11d': 'icons/cloud/cloud-lightning.svg',
        '11n': 'icons/cloud/cloud-lightning.svg',
        '13d': 'icons/cloud/cloud-snow.svg',
        '13n': 'icons/cloud/cloud-snow.svg',
        '50d': 'icons/cloud/cloud.svg', // Placeholder for mist
        '50n': 'icons/cloud/cloud.svg', // Placeholder for mist
    };
    const iconPath = iconMap[iconCode] || 'icons/cloud/cloud.svg'; // Default icon
    return `<img src="${iconPath}" alt="Weather Icon">`;
}

// Fungsi untuk memperbarui latar belakang
function updateBackground(iconCode) {
    const body = document.querySelector('body');
    let backgroundImage = 'assets/background.jpg'; // Default background

    console.log("Icon Code received:", iconCode); // Debugging

    if (iconCode.includes('01d')) { // Cerah (siang)
        backgroundImage = 'assets/cuaca-cerah.jpg';
    } else if (iconCode.includes('01n')) { // Cerah (malam)
        backgroundImage = 'assets/langit-malam.jpg';
    } else if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) { // Berawan
        backgroundImage = 'assets/berawan.jpg';
    } else if (iconCode.includes('09') || iconCode.includes('10')) { // Hujan
        backgroundImage = 'assets/cuaca-hujan.jpg';
    }

    console.log("Setting background to:", backgroundImage); // Debugging
    body.style.backgroundImage = `url('${backgroundImage}')`;
}

// Event Listener untuk tombol pencarian
searchButton.addEventListener('click', () => {
    const city = searchInput.value;
    if (city) {
        getWeather(city);
        searchInput.value = '';
    }
});

searchInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        const city = searchInput.value;
        if (city) {
            getWeather(city);
            searchInput.value = '';
        }
    }
});

// Muat cuaca untuk kota default saat halaman dibuka
window.addEventListener('load', () => {
    getWeatherByLocation();
    renderFavoriteCities(); // Tampilkan kota favorit saat halaman dimuat
    loadCitiesData(); // Muat data kota untuk suggest
});

// Fungsi untuk memuat data kota dari kota.json
async function loadCitiesData() {
    try {
        const response = await fetch('kota.json');
        if (!response.ok) {
            throw new Error('Gagal memuat data kota.');
        }
        const data = await response.json();
        allCities = data.flatMap(provinsi => provinsi.kota);
        console.log("Cities data loaded:", allCities.length, "cities");
    } catch (error) {
        console.error("Error loading cities data:", error);
        displayError('Gagal memuat daftar kota untuk suggest.');
    }
}

// Event Listener untuk input pencarian (suggest lokasi)
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    suggestionsBox.innerHTML = '';

    if (query.length === 0) {
        suggestionsBox.classList.remove('show');
        return;
    }

    const filteredCities = allCities.filter(city => 
        city.toLowerCase().includes(query)
    ).slice(0, 10); // Batasi 10 suggest

    if (filteredCities.length > 0) {
        const ul = document.createElement('ul');
        filteredCities.forEach(city => {
            const li = document.createElement('li');
            li.textContent = city;
            li.addEventListener('click', () => {
                searchInput.value = city;
                suggestionsBox.classList.remove('show');
                getWeather(city);
            });
            ul.appendChild(li);
        });
        suggestionsBox.appendChild(ul);
        suggestionsBox.classList.add('show');
    } else {
        suggestionsBox.classList.remove('show');
    }
});

// Sembunyikan suggest box saat klik di luar
document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.remove('show');
    }
});

// Fungsi untuk mendapatkan cuaca berdasarkan lokasi pengguna
function getWeatherByLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const geoUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${apiKey}`;

            try {
                const response = await fetch(geoUrl);
                if (!response.ok) {
                    throw new Error('Gagal mendapatkan nama kota dari koordinat.');
                }
                const data = await response.json();
                if (data.length > 0) {
                    getWeather(data[0].name); // Ambil nama kota pertama
                } else {
                    displayError('Tidak dapat menemukan kota dari lokasi Anda. Memuat cuaca untuk Jakarta.');
                    getWeather('Jakarta'); // Fallback jika tidak ada kota ditemukan
                }
            } catch (error) {
                console.error("Error reverse geocoding:", error);
                displayError('Gagal mendapatkan lokasi Anda. Memuat cuaca untuk Jakarta.');
                getWeather('Jakarta'); // Fallback jika ada error API
            }
        }, (error) => {
            console.error("Error getting geolocation:", error);
            displayError('Izin lokasi ditolak atau terjadi kesalahan. Memuat cuaca untuk Jakarta.');
            getWeather('Jakarta'); // Fallback jika pengguna menolak atau ada error geolocation
        });
    } else {
        displayError('Geolocation tidak didukung oleh browser Anda. Memuat cuaca untuk Jakarta.');
        getWeather('Jakarta'); // Fallback jika geolocation tidak didukung
    }
}