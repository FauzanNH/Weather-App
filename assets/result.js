// Get parameters from URL
const urlParams = new URLSearchParams(window.location.search);
const city = urlParams.get('city');

// Function to go back to the previous page
function goBack() {
    window.history.back();
}

// Function to convert timestamp to Indonesian date format
function formatDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const day = days[date.getDay()];
    const dayOfMonth = date.getDate();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const month = months[date.getMonth()];
    
    return `${day}, ${dayOfMonth} ${month}`;
}

// Function to convert ISO country code to full country name
function getCountryName(countryCode) {
    const regionNames = new Intl.DisplayNames(['id'], {type: 'region'});
    return regionNames.of(countryCode);
}

// Function to show loading animation
function showLoading() {
    document.getElementById('loading-animation').style.display = 'block';
}

// Function to hide loading animation
function hideLoading() {
    document.getElementById('loading-animation').style.display = 'none';
}

// Function to get current weather
async function getCurrentWeather() {
    showLoading(); // Show loading animation
    try {
        const response = await fetch(`weather_api.php?type=current&city=${encodeURIComponent(city)}`);
        
        // Check if the response is valid JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            document.getElementById('result-weather').innerHTML = '<p class="error">City Not Found</p>';
            document.getElementById('forecast-container').innerHTML = '';
            return;
        }
        
        const data = await response.json();
        
        if (response.ok && !data.error) {
            displayCurrentWeather(data);
            // After getting the current weather data, get the 5-day forecast
            getWeatherForecast(city);
        } else {
            document.getElementById('result-weather').innerHTML = '<p class="error">City Not Found</p>';
            document.getElementById('forecast-container').innerHTML = '';
        }
    } catch (error) {
        document.getElementById('result-weather').innerHTML = '<p class="error">City Not Found</p>';
        document.getElementById('forecast-container').innerHTML = '';
    } finally {
        hideLoading(); // Hide loading animation
    }
}

// Function to display current weather
function displayCurrentWeather(data) {
    const weatherDiv = document.getElementById('result-weather');
    const weatherDescription = data.weather[0].description;
    const iconCode = data.weather[0].icon;
    const iconUrl = `http://openweathermap.org/img/wn/${iconCode}@2x.png`;
    const countryName = getCountryName(data.sys.country);
    
    weatherDiv.innerHTML = `
        <div class="weather-card current">
            <h2>${data.name}, ${countryName}</h2>
            <div class="weather-main">
                <img src="${iconUrl}" alt="${weatherDescription}">
                <p class="temp">${Math.round(data.main.temp)}°C</p>
            </div>
            <p class="description">${weatherDescription}</p>
            <div class="weather-details">
                <p>Humidity: ${data.main.humidity}%</p>
                <p>Wind Speed: ${data.wind.speed} m/s</p>
                <p>Pressure: ${data.main.pressure} hPa</p>
            </div>
        </div>
    `;
}

// Function to get 5-day weather forecast
async function getWeatherForecast(city) {
    showLoading(); 
    try {
        const response = await fetch(`weather_api.php?type=forecast&city=${encodeURIComponent(city)}`);
        
        // Check if the response is valid JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            document.getElementById('forecast-container').innerHTML = '';
            return;
        }
        
        const data = await response.json();
        
        if (response.ok && !data.error) {
            processForecastData(data.list);
        } else {
            document.getElementById('forecast-container').innerHTML = '';
        }
    } catch (error) {
        document.getElementById('forecast-container').innerHTML = '';
    } finally {
        hideLoading(); 
    }
}

// Function to process and group daily forecast data
function processForecastData(forecastList) {
    // Create an object to store data per day
    const dailyData = {};
    
    // Process data every 3 hours into daily data
    forecastList.forEach(item => {
        // Get date from timestamp
        const date = new Date(item.dt * 1000);
        const dateStr = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
        
        // If the date is not in the object, initialize it
        if (!dailyData[dateStr]) {
            dailyData[dateStr] = {
                dt: item.dt,
                temp_min: item.main.temp_min,
                temp_max: item.main.temp_max,
                weather: item.weather[0],
                // Store all temperatures to calculate the average
                temps: [item.main.temp]
            };
        } else {
            // Update min/max temperature
            if (item.main.temp_min < dailyData[dateStr].temp_min) {
                dailyData[dateStr].temp_min = item.main.temp_min;
            }
            if (item.main.temp_max > dailyData[dateStr].temp_max) {
                dailyData[dateStr].temp_max = item.main.temp_max;
            }
            // Add temperature to the array
            dailyData[dateStr].temps.push(item.main.temp);
            
            // Get weather data for the afternoon period if available (around 12 PM)
            const hour = date.getHours();
            if (hour >= 11 && hour <= 14) {
                dailyData[dateStr].weather = item.weather[0];
            }
        }
    });
    
    // Convert object to array for display
    const dailyForecast = Object.values(dailyData);
    
    // Display daily forecast
    displayForecast(dailyForecast.slice(0, 7)); // Take a maximum of 7 days
}

// Function to display daily weather forecast
function displayForecast(dailyData) {
    const forecastContainer = document.getElementById('forecast-container');
    let forecastHTML = '';
    
    dailyData.forEach(day => {
        const date = formatDate(day.dt);
        const iconCode = day.weather.icon;
        const iconUrl = `http://openweathermap.org/img/wn/${iconCode}.png`;
        const description = day.weather.description;
        const tempMax = Math.round(day.temp_max);
        const tempMin = Math.round(day.temp_min);
        
        forecastHTML += `
            <div class="forecast-card">
                <div class="forecast-date">${date}</div>
                <div class="forecast-icon">
                    <img src="${iconUrl}" alt="${description}">
                </div>
                <div class="forecast-temp">
                    <span class="max">${tempMax}°C</span>
                    <span class="min">${tempMin}°C</span>
                </div>
                <div class="forecast-desc">${description}</div>
            </div>
        `;
    });
    
    forecastContainer.innerHTML = forecastHTML;
}

// Call function to get weather data when the page first loads
window.onload = function() {
    if (city) {
        getCurrentWeather();
    } else {
        document.getElementById('result-weather').innerHTML = '<p class="error">City not found in parameters.</p>';
    }
};