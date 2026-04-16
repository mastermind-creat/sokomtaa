<?php
$host = '127.0.0.1';
$user = 'root';
$pass = '';

$conn = mysqli_connect($host, $user, $pass);
if (!$conn) {
    die("Connection failed: " . mysqli_connect_error());
}

$sql = "CREATE DATABASE IF NOT EXISTS sokomtaa";
if (mysqli_query($conn, $sql)) {
    echo "Database created successfully or already exists\n";
} else {
    echo "Error creating database: " . mysqli_error($conn) . "\n";
}

mysqli_close($conn);
