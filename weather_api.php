<?php
$openWeatherApiKey = 'your_openweather_api_key';

header('Content-Type: application/json');

$city = isset($_GET['city']) ? $_GET['city'] : '';
$type = isset($_GET['type']) ? $_GET['type'] : 'current';

if (empty($city)) {
    echo json_encode(['error' => true, 'message' => 'Parameter kota diperlukan']);
    exit;
}

$apiUrl = '';
if ($type === 'current') {
    $apiUrl = "https://api.openweathermap.org/data/2.5/weather?q={$city}&appid={$openWeatherApiKey}&units=metric&lang=id";
} else if ($type === 'forecast') {
    $apiUrl = "https://api.openweathermap.org/data/2.5/forecast?q={$city}&appid={$openWeatherApiKey}&units=metric&lang=id";
} else {
    echo json_encode(['error' => true, 'message' => 'Tipe tidak valid']);
    exit;
}

$context = stream_context_create(['http' => ['ignore_errors' => true]]);
$response = file_get_contents($apiUrl, false, $context);

if ($response === FALSE) {
    echo json_encode(['error' => true, 'message' => 'City Not Found']);
    exit;
}

$responseData = json_decode($response, true);
if (isset($responseData['cod']) && $responseData['cod'] != 200) {
    echo json_encode(['error' => true, 'message' => 'City Not Found']);
    exit;
}

echo $response;
?> 