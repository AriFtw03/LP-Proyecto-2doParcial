<?php
// APORTE: ARIANNA FEIJOO
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("X-Content-Type-Options: nosniff");

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
                $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
                if ($id === false || $id <= 0) {
                    http_response_code(400);
                    echo json_encode(["error" => "ID de mascota no válido."]);
                    exit;
                }
                $stmt = $pdo->prepare("SELECT * FROM mascotas WHERE id = ?");
                $stmt->execute([$id]);
                $mascota = $stmt->fetch();
                if ($mascota) {
                    echo json_encode($mascota);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Mascota no encontrada."]);
                }
            } elseif (isset($_GET['estado_adopcion'])) {
                $estado = trim($_GET['estado_adopcion']);
                $permitidos = ['disponible', 'en proceso', 'adoptado'];
                if (!in_array($estado, $permitidos, true)) {
                    http_response_code(400);
                    echo json_encode(["error" => "Estado de adopción no válido."]);
                    exit;
                }
                $stmt = $pdo->prepare("SELECT * FROM mascotas WHERE estado_adopcion = ? ORDER BY fecha_ingreso DESC");
                $stmt->execute([$estado]);
                echo json_encode($stmt->fetchAll());
            } else {
                $stmt = $pdo->query("SELECT * FROM mascotas ORDER BY fecha_ingreso DESC");
                echo json_encode($stmt->fetchAll());
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error interno al consultar expedientes de mascotas."]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!$datos) {
            http_response_code(400);
            echo json_encode(["error" => "Cuerpo de solicitud JSON no válido."]);
            exit;
        }

        $nombre = isset($datos['nombre']) ? trim($datos['nombre']) : '';
        $especie = isset($datos['especie']) ? trim($datos['especie']) : '';
        $raza = isset($datos['raza']) ? trim($datos['raza']) : 'Mestizo';
        $estado_salud = isset($datos['estado_salud']) ? trim($datos['estado_salud']) : 'No evaluado';
        $estado_adopcion = isset($datos['estado_adopcion']) ? trim($datos['estado_adopcion']) : 'disponible';

        if (empty($nombre) || empty($especie)) {
            http_response_code(400);
            echo json_encode(["error" => "Faltan datos requeridos: nombre y especie son obligatorios."]);
            exit;
        }

        $permitidos = ['disponible', 'en proceso', 'adoptado'];
        if (!in_array($estado_adopcion, $permitidos, true)) {
            http_response_code(400);
            echo json_encode(["error" => "Estado de adopción no válido. Opciones: disponible, en proceso, adoptado."]);
            exit;
        }

        $sql = "INSERT INTO mascotas (nombre, especie, raza, estado_salud, estado_adopcion) VALUES (?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                mb_substr($nombre, 0, 100),
                mb_substr($especie, 0, 50),
                mb_substr($raza, 0, 50),
                mb_substr($estado_salud, 0, 100),
                $estado_adopcion
            ]);
            http_response_code(201);
            echo json_encode([
                "mensaje" => "Expediente de mascota creado exitosamente.",
                "id" => (int) $pdo->lastInsertId()
            ]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error interno al registrar la mascota."]);
        }
        break;

    case 'PUT':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!$datos) {
            http_response_code(400);
            echo json_encode(["error" => "Cuerpo de solicitud JSON no válido."]);
            exit;
        }

        $rawId = $datos['id'] ?? ($_GET['id'] ?? null);
        $id = filter_var($rawId, FILTER_VALIDATE_INT);

        if ($id === false || $id <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Se requiere un ID numérico válido para actualizar el expediente."]);
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

            $nombre = isset($datos['nombre']) ? trim($datos['nombre']) : $actual['nombre'];
            $especie = isset($datos['especie']) ? trim($datos['especie']) : $actual['especie'];
            $raza = isset($datos['raza']) ? trim($datos['raza']) : $actual['raza'];
            $estado_salud = isset($datos['estado_salud']) ? trim($datos['estado_salud']) : $actual['estado_salud'];
            $estado_adopcion = isset($datos['estado_adopcion']) ? trim($datos['estado_adopcion']) : $actual['estado_adopcion'];

            if (empty($nombre) || empty($especie)) {
                http_response_code(400);
                echo json_encode(["error" => "El nombre y la especie no pueden estar vacíos."]);
                exit;
            }

            $permitidos = ['disponible', 'en proceso', 'adoptado'];
            if (!in_array($estado_adopcion, $permitidos, true)) {
                http_response_code(400);
                echo json_encode(["error" => "Estado de adopción no válido."]);
                exit;
            }

            $sql = "UPDATE mascotas SET nombre = ?, especie = ?, raza = ?, estado_salud = ?, estado_adopcion = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                mb_substr($nombre, 0, 100),
                mb_substr($especie, 0, 50),
                mb_substr($raza, 0, 50),
                mb_substr($estado_salud, 0, 100),
                $estado_adopcion,
                $id
            ]);

            echo json_encode(["mensaje" => "Expediente de mascota actualizado exitosamente."]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error interno al actualizar el expediente de mascota."]);
        }
        break;

    case 'DELETE':
        $datos = json_decode(file_get_contents("php://input"), true) ?: [];
        $rawId = $datos['id'] ?? ($_GET['id'] ?? null);
        $id = filter_var($rawId, FILTER_VALIDATE_INT);

        if ($id === false || $id <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Se requiere un ID numérico válido para eliminar el expediente."]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM mascotas WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(["mensaje" => "Expediente de mascota eliminado correctamente."]);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Mascota no encontrada."]);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error interno al eliminar el expediente de mascota."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método HTTP no permitido."]);
        break;
}