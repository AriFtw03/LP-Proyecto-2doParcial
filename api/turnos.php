<?php
// APORTE DIEGO ALFONZO
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");

require_once '../config/conexion.php';
$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        // Muestra los turnos programados
        try {
            $stmt = $pdo->query("SELECT * FROM turnos ORDER BY fecha_turno ASC");
            echo json_encode($stmt->fetchAll());
        } catch (\PDOException $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        // Asigna un nuevo turno a un voluntario
        $datos = json_decode(file_get_contents("php://input"), true);
        if (empty($datos['nombre_voluntario']) || empty($datos['fecha_turno'])) {
            echo json_encode(["error" => "Faltan datos del voluntario o fecha."]);
            exit;
        }
        $sql = "INSERT INTO turnos (nombre_voluntario, tarea_asignada, fecha_turno, hora_inicio) VALUES (?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                $datos['nombre_voluntario'], $datos['tarea_asignada'], 
                $datos['fecha_turno'], $datos['hora_inicio'] ?? '08:00:00'
            ]);
            echo json_encode(["mensaje" => "Turno de voluntariado asignado."]);
        } catch (\PDOException $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;
}
?>