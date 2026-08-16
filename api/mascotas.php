<?php
// APORTE ARIANNA FEIJOO
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/conexion.php';
$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        try {
            if (isset($_GET['id'])) {
                $stmt = $pdo->prepare("SELECT * FROM mascotas WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $mascota = $stmt->fetch();
                if ($mascota) {
                    echo json_encode($mascota);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Mascota no encontrada."]);
                }
            } elseif (isset($_GET['estado_adopcion'])) {
                $stmt = $pdo->prepare("SELECT * FROM mascotas WHERE estado_adopcion = ? ORDER BY fecha_ingreso DESC");
                $stmt->execute([$_GET['estado_adopcion']]);
                echo json_encode($stmt->fetchAll());
            } else {
                $stmt = $pdo->query("SELECT * FROM mascotas ORDER BY fecha_ingreso DESC");
                echo json_encode($stmt->fetchAll());
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (empty($datos['nombre']) || empty($datos['especie'])) {
            http_response_code(400);
            echo json_encode(["error" => "Faltan datos requeridos (nombre, especie)."]);
            exit;
        }
        $sql = "INSERT INTO mascotas (nombre, especie, raza, estado_salud, estado_adopcion) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                $datos['nombre'],
                $datos['especie'], 
                $datos['raza'] ?? 'Mestizo',
                $datos['estado_salud'] ?? 'No evaluado',
                $datos['estado_adopcion'] ?? 'disponible'
            ]);
            http_response_code(201);
            echo json_encode(["mensaje" => "Expediente creado.", "id" => $pdo->lastInsertId()]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'PUT':
        $datos = json_decode(file_get_contents("php://input"), true);
        $id = $datos['id'] ?? ($_GET['id'] ?? null);

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["error" => "Se requiere el ID de la mascota para actualizar."]);
            exit;
        }

        try {
            $stmtCheck = $pdo->prepare("SELECT * FROM mascotas WHERE id = ?");
            $stmtCheck->execute([$id]);
            $actual = $stmtCheck->fetch();

            if (!$actual) {
                http_response_code(404);
                echo json_encode(["error" => "Mascota no encontrada."]);
                exit;
            }

            $nombre = $datos['nombre'] ?? $actual['nombre'];
            $especie = $datos['especie'] ?? $actual['especie'];
            $raza = $datos['raza'] ?? $actual['raza'];
            $estado_salud = $datos['estado_salud'] ?? $actual['estado_salud'];
            $estado_adopcion = $datos['estado_adopcion'] ?? $actual['estado_adopcion'];

            $sql = "UPDATE mascotas SET nombre = ?, especie = ?, raza = ?, estado_salud = ?, estado_adopcion = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$nombre, $especie, $raza, $estado_salud, $estado_adopcion, $id]);

            echo json_encode(["mensaje" => "Expediente de mascota actualizado exitosamente."]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        $datos = json_decode(file_get_contents("php://input"), true);
        $id = $datos['id'] ?? ($_GET['id'] ?? null);

        if (empty($id)) {
            http_response_code(400);
            echo json_encode(["error" => "Se requiere el ID de la mascota a eliminar."]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM mascotas WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(["mensaje" => "Mascota eliminada correctamente."]);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Mascota no encontrada."]);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método no permitido."]);
        break;
}
?>