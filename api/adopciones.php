<?php
// APORTE: MATIAS COLLAGUAZO
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
                    echo json_encode(["error" => "ID de solicitud no válido."]);
                    exit;
                }
                $stmt = $pdo->prepare("SELECT a.*, m.nombre AS mascota_nombre, m.especie AS mascota_especie 
                                       FROM adopciones a 
                                       LEFT JOIN mascotas m ON a.mascota_id = m.id 
                                       WHERE a.id = ?");
                $stmt->execute([$id]);
                $solicitud = $stmt->fetch();
                if ($solicitud) {
                    echo json_encode($solicitud);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Solicitud de adopción no encontrada."]);
                }
            } elseif (isset($_GET['mascota_id'])) {
                $mascotaId = filter_var($_GET['mascota_id'], FILTER_VALIDATE_INT);
                if ($mascotaId === false || $mascotaId <= 0) {
                    http_response_code(400);
                    echo json_encode(["error" => "ID de mascota no válido."]);
                    exit;
                }
                $stmt = $pdo->prepare("SELECT a.*, m.nombre AS mascota_nombre, m.especie AS mascota_especie 
                                       FROM adopciones a 
                                       LEFT JOIN mascotas m ON a.mascota_id = m.id 
                                       WHERE a.mascota_id = ? 
                                       ORDER BY a.fecha_solicitud DESC");
                $stmt->execute([$mascotaId]);
                echo json_encode($stmt->fetchAll());
            } elseif (isset($_GET['estado_solicitud'])) {
                $estado = trim($_GET['estado_solicitud']);
                $permitidos = ['pendiente', 'aprobada', 'rechazada'];
                if (!in_array($estado, $permitidos, true)) {
                    http_response_code(400);
                    echo json_encode(["error" => "Estado de solicitud no válido."]);
                    exit;
                }
                $stmt = $pdo->prepare("SELECT a.*, m.nombre AS mascota_nombre, m.especie AS mascota_especie 
                                       FROM adopciones a 
                                       LEFT JOIN mascotas m ON a.mascota_id = m.id 
                                       WHERE a.estado_solicitud = ? 
                                       ORDER BY a.fecha_solicitud DESC");
                $stmt->execute([$estado]);
                echo json_encode($stmt->fetchAll());
            } else {
                $stmt = $pdo->query("SELECT a.*, m.nombre AS mascota_nombre, m.especie AS mascota_especie 
                                     FROM adopciones a 
                                     LEFT JOIN mascotas m ON a.mascota_id = m.id 
                                     ORDER BY a.fecha_solicitud DESC");
                echo json_encode($stmt->fetchAll());
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error interno al consultar solicitudes de adopción."]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!$datos) {
            http_response_code(400);
            echo json_encode(["error" => "Cuerpo de solicitud JSON no válido."]);
            exit;
        }

        $mascotaId = filter_var($datos['mascota_id'] ?? null, FILTER_VALIDATE_INT);
        $nombreSolicitante = isset($datos['nombre_solicitante']) ? trim($datos['nombre_solicitante']) : '';
        $correoContacto = isset($datos['correo_contacto']) ? trim($datos['correo_contacto']) : '';
        $estadoSolicitud = isset($datos['estado_solicitud']) ? trim($datos['estado_solicitud']) : 'pendiente';

        if ($mascotaId === false || $mascotaId <= 0 || empty($nombreSolicitante) || empty($correoContacto)) {
            http_response_code(400);
            echo json_encode(["error" => "Faltan datos requeridos o son inválidos (mascota_id, nombre_solicitante, correo_contacto)."]);
            exit;
        }

        if (!filter_var($correoContacto, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["error" => "El correo electrónico ingresado no tiene un formato válido."]);
            exit;
        }

        $permitidos = ['pendiente', 'aprobada', 'rechazada'];
        if (!in_array($estadoSolicitud, $permitidos, true)) {
            $estadoSolicitud = 'pendiente';
        }

        try {
            $pdo->beginTransaction();

            $stmtMascota = $pdo->prepare("SELECT * FROM mascotas WHERE id = ? FOR UPDATE");
            $stmtMascota->execute([$mascotaId]);
            $mascota = $stmtMascota->fetch();

            if (!$mascota) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(["error" => "La mascota especificada no existe en el refugio."]);
                exit;
            }

            if ($mascota['estado_adopcion'] === 'adoptado') {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(["error" => "La mascota ya ha sido adoptada previamente."]);
                exit;
            }

            $sql = "INSERT INTO adopciones (mascota_id, nombre_solicitante, correo_contacto, estado_solicitud) VALUES (?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $mascotaId,
                mb_substr($nombreSolicitante, 0, 100),
                mb_substr($correoContacto, 0, 100),
                $estadoSolicitud
            ]);
            $solicitudId = (int) $pdo->lastInsertId();

            if ($mascota['estado_adopcion'] === 'disponible') {
                $stmtUpdateM = $pdo->prepare("UPDATE mascotas SET estado_adopcion = 'en proceso' WHERE id = ?");
                $stmtUpdateM->execute([$mascotaId]);
            }

            $pdo->commit();

            http_response_code(201);
            echo json_encode([
                "mensaje" => "Solicitud de adopción registrada exitosamente.",
                "id" => $solicitudId
            ]);
        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(["error" => "Error interno al procesar la solicitud de adopción."]);
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
        $nuevoEstado = isset($datos['estado_solicitud']) ? trim($datos['estado_solicitud']) : '';

        if ($id === false || $id <= 0 || empty($nuevoEstado)) {
            http_response_code(400);
            echo json_encode(["error" => "Se requiere un ID numérico válido y el campo estado_solicitud."]);
            exit;
        }

        $permitidos = ['pendiente', 'aprobada', 'rechazada'];
        if (!in_array($nuevoEstado, $permitidos, true)) {
            http_response_code(400);
            echo json_encode(["error" => "Estado de solicitud no válido. Valores admitidos: pendiente, aprobada, rechazada."]);
            exit;
        }

        try {
            $pdo->beginTransaction();

            $stmtCheck = $pdo->prepare("SELECT * FROM adopciones WHERE id = ? FOR UPDATE");
            $stmtCheck->execute([$id]);
            $solicitud = $stmtCheck->fetch();

            if (!$solicitud) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(["error" => "Solicitud de adopción no encontrada."]);
                exit;
            }

            $stmtUpdate = $pdo->prepare("UPDATE adopciones SET estado_solicitud = ? WHERE id = ?");
            $stmtUpdate->execute([$nuevoEstado, $id]);

            $mascotaId = (int) $solicitud['mascota_id'];

            if ($nuevoEstado === 'aprobada') {
                $stmtM = $pdo->prepare("UPDATE mascotas SET estado_adopcion = 'adoptado' WHERE id = ?");
                $stmtM->execute([$mascotaId]);
            } elseif ($nuevoEstado === 'rechazada') {
                $stmtOtras = $pdo->prepare("SELECT COUNT(*) FROM adopciones WHERE mascota_id = ? AND estado_solicitud IN ('pendiente', 'aprobada') AND id != ?");
                $stmtOtras->execute([$mascotaId, $id]);
                $cantOtras = (int) $stmtOtras->fetchColumn();

                if ($cantOtras === 0) {
                    $stmtM = $pdo->prepare("UPDATE mascotas SET estado_adopcion = 'disponible' WHERE id = ?");
                    $stmtM->execute([$mascotaId]);
                }
            } elseif ($nuevoEstado === 'pendiente') {
                $stmtM = $pdo->prepare("UPDATE mascotas SET estado_adopcion = 'en proceso' WHERE id = ? AND estado_adopcion != 'adoptado'");
                $stmtM->execute([$mascotaId]);
            }

            $pdo->commit();

            echo json_encode(["mensaje" => "Estado de solicitud actualizado a '{$nuevoEstado}' exitosamente."]);
        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(["error" => "Error interno al actualizar la solicitud de adopción."]);
        }
        break;

    case 'DELETE':
        $datos = json_decode(file_get_contents("php://input"), true) ?: [];
        $rawId = $datos['id'] ?? ($_GET['id'] ?? null);
        $id = filter_var($rawId, FILTER_VALIDATE_INT);

        if ($id === false || $id <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Se requiere un ID numérico válido para eliminar la solicitud."]);
            exit;
        }

        try {
            $pdo->beginTransaction();

            $stmtCheck = $pdo->prepare("SELECT * FROM adopciones WHERE id = ? FOR UPDATE");
            $stmtCheck->execute([$id]);
            $solicitud = $stmtCheck->fetch();

            if (!$solicitud) {
                $pdo->rollBack();
                http_response_code(404);
                echo json_encode(["error" => "Solicitud de adopción no encontrada."]);
                exit;
            }

            $mascotaId = (int) $solicitud['mascota_id'];

            $stmtDel = $pdo->prepare("DELETE FROM adopciones WHERE id = ?");
            $stmtDel->execute([$id]);

            $stmtOtras = $pdo->prepare("SELECT COUNT(*) FROM adopciones WHERE mascota_id = ? AND estado_solicitud IN ('pendiente', 'aprobada')");
            $stmtOtras->execute([$mascotaId]);
            $cantOtras = (int) $stmtOtras->fetchColumn();

            if ($cantOtras === 0) {
                $stmtM = $pdo->prepare("UPDATE mascotas SET estado_adopcion = 'disponible' WHERE id = ? AND estado_adopcion != 'adoptado'");
                $stmtM->execute([$mascotaId]);
            }

            $pdo->commit();

            echo json_encode(["mensaje" => "Solicitud de adopción eliminada correctamente."]);
        } catch (\PDOException $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(["error" => "Error interno al eliminar la solicitud de adopción."]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(["error" => "Método HTTP no permitido."]);
        break;
}