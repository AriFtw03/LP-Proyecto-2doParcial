<?php
// APORTE: DIEGO ALFONZO
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

function validarFecha(string $fecha): bool {
    $d = DateTime::createFromFormat('Y-m-d', $fecha);
    return $d && $d->format('Y-m-d') === $fecha;
}

switch ($metodo) {
    case 'GET':
        try {
            if (isset($_GET['id'])) {
                $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
                if ($id === false || $id <= 0) {
                    http_response_code(400);
                    echo json_encode(["error" => "ID de turno no válido."]);
                    exit;
                }
                $stmt = $pdo->prepare("SELECT * FROM turnos WHERE id = ?");
                $stmt->execute([$id]);
                $turno = $stmt->fetch();
                if ($turno) {
                    echo json_encode($turno);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Turno no encontrado."]);
                }
            } elseif (isset($_GET['fecha_inicio']) && isset($_GET['fecha_fin'])) {
                $inicio = trim($_GET['fecha_inicio']);
                $fin = trim($_GET['fecha_fin']);
                if (!validarFecha($inicio) || !validarFecha($fin)) {
                    http_response_code(400);
                    echo json_encode(["error" => "El rango de fechas debe tener formato YYYY-MM-DD."]);
                    exit;
                }
                $stmt = $pdo->prepare("SELECT * FROM turnos WHERE fecha_turno BETWEEN ? AND ? ORDER BY fecha_turno ASC, hora_inicio ASC");
                $stmt->execute([$inicio, $fin]);
                echo json_encode($stmt->fetchAll());
            } elseif (isset($_GET['fecha'])) {
                $fecha = trim($_GET['fecha']);
                if (!validarFecha($fecha)) {
                    http_response_code(400);
                    echo json_encode(["error" => "La fecha debe tener formato YYYY-MM-DD."]);
                    exit;
                }
                $stmt = $pdo->prepare("SELECT * FROM turnos WHERE fecha_turno = ? ORDER BY hora_inicio ASC");
                $stmt->execute([$fecha]);
                echo json_encode($stmt->fetchAll());
            } elseif (isset($_GET['voluntario'])) {
                $voluntario = trim($_GET['voluntario']);
                $stmt = $pdo->prepare("SELECT * FROM turnos WHERE nombre_voluntario LIKE ? ORDER BY fecha_turno ASC, hora_inicio ASC");
                $stmt->execute(['%' . $voluntario . '%']);
                echo json_encode($stmt->fetchAll());
            } else {
                $stmt = $pdo->query("SELECT * FROM turnos ORDER BY fecha_turno ASC, hora_inicio ASC");
                echo json_encode($stmt->fetchAll());
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error interno al consultar turnos de voluntariado."]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!$datos) {
            http_response_code(400);
            echo json_encode(["error" => "Cuerpo de solicitud JSON no válido."]);
            exit;
        }

        $nombreVoluntario = isset($datos['nombre_voluntario']) ? trim($datos['nombre_voluntario']) : '';
        $tareaAsignada = isset($datos['tarea_asignada']) ? trim($datos['tarea_asignada']) : '';
        $fechaTurno = isset($datos['fecha_turno']) ? trim($datos['fecha_turno']) : '';
        $horaInicio = isset($datos['hora_inicio']) ? trim($datos['hora_inicio']) : '08:00:00';

        if (empty($nombreVoluntario) || empty($tareaAsignada) || empty($fechaTurno)) {
            http_response_code(400);
            echo json_encode(["error" => "Faltan datos requeridos (nombre_voluntario, tarea_asignada, fecha_turno)."]);
            exit;
        }

        if (!validarFecha($fechaTurno)) {
            http_response_code(400);
            echo json_encode(["error" => "Formato de fecha_turno no válido. Se espera YYYY-MM-DD."]);
            exit;
        }

        if (strlen($horaInicio) === 5) {
            $horaInicio .= ':00';
        }

        $sql = "INSERT INTO turnos (nombre_voluntario, tarea_asignada, fecha_turno, hora_inicio) VALUES (?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        try {
            $stmt->execute([
                mb_substr($nombreVoluntario, 0, 100),
                mb_substr($tareaAsignada, 0, 150),
                $fechaTurno,
                $horaInicio
            ]);
            http_response_code(201);
            echo json_encode([
                "mensaje" => "Turno de voluntariado asignado exitosamente.",
                "id" => (int) $pdo->lastInsertId()
            ]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error interno al registrar el turno."]);
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
            echo json_encode(["error" => "Se requiere un ID numérico válido para actualizar el turno."]);
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

            $nombreVoluntario = isset($datos['nombre_voluntario']) ? trim($datos['nombre_voluntario']) : $actual['nombre_voluntario'];
            $tareaAsignada = isset($datos['tarea_asignada']) ? trim($datos['tarea_asignada']) : $actual['tarea_asignada'];
            $fechaTurno = isset($datos['fecha_turno']) ? trim($datos['fecha_turno']) : $actual['fecha_turno'];
            $horaInicio = isset($datos['hora_inicio']) ? trim($datos['hora_inicio']) : $actual['hora_inicio'];

            if (empty($nombreVoluntario) || empty($tareaAsignada) || empty($fechaTurno)) {
                http_response_code(400);
                echo json_encode(["error" => "Los campos obligatorios no pueden quedar vacíos."]);
                exit;
            }

            if (!validarFecha($fechaTurno)) {
                http_response_code(400);
                echo json_encode(["error" => "Formato de fecha_turno no válido."]);
                exit;
            }

            if (strlen($horaInicio) === 5) {
                $horaInicio .= ':00';
            }

            $sql = "UPDATE turnos SET nombre_voluntario = ?, tarea_asignada = ?, fecha_turno = ?, hora_inicio = ? WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                mb_substr($nombreVoluntario, 0, 100),
                mb_substr($tareaAsignada, 0, 150),
                $fechaTurno,
                $horaInicio,
                $id
            ]);

            echo json_encode(["mensaje" => "Turno de voluntariado actualizado exitosamente."]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error interno al actualizar el turno."]);
        }
        break;

    case 'DELETE':
        $datos = json_decode(file_get_contents("php://input"), true) ?: [];
        $rawId = $datos['id'] ?? ($_GET['id'] ?? null);
        $id = filter_var($rawId, FILTER_VALIDATE_INT);

        if ($id === false || $id <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Se requiere un ID numérico válido para eliminar el turno."]);
            exit;
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM turnos WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() > 0) {
                echo json_encode(["mensaje" => "Turno de voluntariado eliminado correctamente."]);
            } else {
                http_response_code(404);
                echo json_encode(["error" => "Turno no encontrado."]);
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error interno al eliminar el turno."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método HTTP no permitido."]);
        break;
}