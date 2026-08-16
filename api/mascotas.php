<?php
// APORTE ARIANNA FEIJOO
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");

require_once '../config/conexion.php';
$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT * FROM mascotas ORDER BY fecha_ingreso DESC");
            echo json_encode($stmt->fetchAll());
        } catch (\PDOException $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (empty($datos['nombre']) || empty($datos['especie'])) {
            echo json_encode(["error" => "Faltan datos."]);
            exit;
        }
        $sql = "INSERT INTO mascotas (nombre, especie, raza, estado_salud) VALUES (?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                $datos['nombre'], $datos['especie'], 
                $datos['raza'] ?? 'Mestizo', $datos['estado_salud'] ?? 'No evaluado'
            ]);
            echo json_encode(["mensaje" => "Expediente creado."]);
        } catch (\PDOException $e) {
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;
}
?>