<?php
// APORTE DIEGO ALFONZO
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
                $stmt = $pdo->prepare("SELECT * FROM turnos WHERE id = ?");
                $stmt->execute([$_GET['id']]);
                $turno = $stmt->fetch();
                if ($turno) {
                    echo json_encode($turno);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Turno no encontrado."]);
                }
            } elseif (isset($_GET['fecha_inicio']) && isset($_GET['fecha_fin'])) {
                // Consulta por rango de fechas para vista de calendario
                $stmt = $pdo->prepare("SELECT * FROM turnos WHERE fecha_turno BETWEEN ? AND ? ORDER BY fecha_turno ASC, hora_inicio ASC");
                $stmt->execute([$_GET['fecha_inicio'], $_GET['fecha_fin']]);
                echo json_encode($stmt->fetchAll());
            } elseif (isset($_GET['fecha'])) {
                // Consulta por fecha específica
                $stmt = $pdo->prepare("SELECT * FROM turnos WHERE fecha_turno = ? ORDER BY hora_inicio ASC");
                $stmt->execute([$_GET['fecha']]);
                echo json_encode($stmt->fetchAll());
            } elseif (isset($_GET['voluntario'])) {
                // Consulta por nombre de voluntario
                $stmt = $pdo->prepare("SELECT * FROM turnos WHERE nombre_voluntario LIKE ? ORDER BY fecha_turno ASC, hora_inicio ASC");
                $stmt->execute(['%' . $_GET['voluntario'] . '%']);
                echo json_encode($stmt->fetchAll());
            } else {
                $stmt = $pdo->query("SELECT * FROM turnos ORDER BY fecha_turno ASC, hora_inicio ASC");
                echo json_encode($stmt->fetchAll());
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (empty($datos['nombre_voluntario']) || empty($datos['fecha_turno']) || empty($datos['tarea_asignada'])) {
            http_response_code(400);
            echo json_encode(["error" => "Faltan datos requeridos (nombre_voluntario, tarea_asignada, fecha_turno)."]);
            exit;
        }

        $sql = "INSERT INTO turnos (nombre_voluntario, tarea_asignada, fecha_turno, hora_inicio) VALUES (?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                $datos['nombre_voluntario'], 
                $datos['tarea_asignada'], 
                $datos['fecha_turno'], 
                $datos['hora_inicio'] ?? '08:00:00'
            ]);
            http_response_code(201);
            echo json_encode([
                "mensaje" => "Turno de voluntariado asignado.", 
                "id" => $pdo->lastInsertId()
            ]);
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
            echo json_encode(["error" => "Se requiere el ID del turno para actualizar."]);
            exit;
        }

        try {
            $stmtCheck = $pdo->prepare("SELECT * FROM turnos WHERE id = ?");
            $stmtCheck->execute([$id]);
            $actual = $stmtCheck->fetch();

            if (!$actual) {
                http_response_code(404);
                echo json_encode(["error" => "Turno no encontrado."]);
                exit;
            }

            $nombreVoluntario = $datos['nombre_voluntario'] ?? $actual['nombre_voluntario'];
            $tareaAsignada = $datos['tarea_asignada'] ?? $actual['tarea_asignada'];
            $fechaTurno = $datos['fecha_turno'] ?? $actual['fecha_turno'];
            $horaInicio = $datos['hora_inicio'] ?? $actual['hora_inicio'];

            $sql = "UPDATE turnos SET nombre_voluntario = ?, tarea_asignada = ?, fecha_turno = ?, hora_inicio = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$nombreVoluntario, $tareaAsignada, $fechaTurno, $horaInicio, $id]);

            echo json_encode(["mensaje" => "Turno de voluntariado actualizado exitosamente."]);
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
            echo json_encode(["error" => "Se requiere el ID del turno a eliminar."]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM turnos WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(["mensaje" => "Turno eliminado correctamente."]);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Turno no encontrado."]);
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