<?php
// APORTE MATIAS COLLAGUAZO
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");

require_once '../config/conexion.php';
$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        // Lee todas las solicitudes de adopción
        try {
            $stmt = $pdo->query("SELECT * FROM adopciones ORDER BY fecha_solicitud DESC");
            echo json_encode($stmt->fetchAll());
        } catch (\PDOException $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Registra una nueva solicitud de adopción
        $datos = json_decode(file_get_contents("php://input"), true);
        if (empty($datos['mascota_id']) || empty($datos['nombre_solicitante'])) {
            echo json_encode(["error" => "Faltan datos del solicitante o mascota."]);
            exit;
        }
        $sql = "INSERT INTO adopciones (mascota_id, nombre_solicitante, correo_contacto) VALUES (?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                $datos['mascota_id'], $datos['nombre_solicitante'], $datos['correo_contacto']
            ]);
            echo json_encode(["mensaje" => "Solicitud de adopción registrada."]);
        } catch (\PDOException $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;
}
?>