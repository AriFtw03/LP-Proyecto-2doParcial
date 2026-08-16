<?php
// APORTE MATIAS COLLAGUAZO
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
                $stmt = $pdo->prepare("SELECT a.*, m.nombre AS mascota_nombre, m.especie AS mascota_especie 
                                       FROM adopciones a 
                                       LEFT JOIN mascotas m ON a.mascota_id = m.id 
                                       WHERE a.id = ?");
                $stmt->execute([$_GET['id']]);
                $solicitud = $stmt->fetch();
                if ($solicitud) {
                    echo json_encode($solicitud);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Solicitud de adopción no encontrada."]);
                }
            } elseif (isset($_GET['mascota_id'])) {
                $stmt = $pdo->prepare("SELECT a.*, m.nombre AS mascota_nombre 
                                       FROM adopciones a 
                                       LEFT JOIN mascotas m ON a.mascota_id = m.id 
                                       WHERE a.mascota_id = ? 
                                       ORDER BY a.fecha_solicitud DESC");
                $stmt->execute([$_GET['mascota_id']]);
                echo json_encode($stmt->fetchAll());
            } elseif (isset($_GET['estado_solicitud'])) {
                $stmt = $pdo->prepare("SELECT a.*, m.nombre AS mascota_nombre 
                                       FROM adopciones a 
                                       LEFT JOIN mascotas m ON a.mascota_id = m.id 
                                       WHERE a.estado_solicitud = ? 
                                       ORDER BY a.fecha_solicitud DESC");
                $stmt->execute([$_GET['estado_solicitud']]);
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
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (empty($datos['mascota_id']) || empty($datos['nombre_solicitante']) || empty($datos['correo_contacto'])) {
            http_response_code(400);
            echo json_encode(["error" => "Faltan datos requeridos (mascota_id, nombre_solicitante, correo_contacto)."]);
            exit;
        }

        try {
            // Verificar si la mascota existe y su estado
            $stmtMascota = $pdo->prepare("SELECT * FROM mascotas WHERE id = ?");
            $stmtMascota->execute([$datos['mascota_id']]);
            $mascota = $stmtMascota->fetch();

            if (!$mascota) {
                http_response_code(404);
                echo json_encode(["error" => "La mascota especificada no existe."]);
                exit;
            }

            if ($mascota['estado_adopcion'] === 'adoptado') {
                http_response_code(400);
                echo json_encode(["error" => "La mascota ya ha sido adoptada."]);
                exit;
            }

            // Registrar solicitud
            $sql = "INSERT INTO adopciones (mascota_id, nombre_solicitante, correo_contacto, estado_solicitud) VALUES (?, ?, ?, ?)";
            $stmt = $pdo->prepare($sql);
            $estadoSolicitud = $datos['estado_solicitud'] ?? 'pendiente';
            $stmt->execute([
                $datos['mascota_id'],
                $datos['nombre_solicitante'],
                $datos['correo_contacto'],
                $estadoSolicitud
            ]);
            $solicitudId = $pdo->lastInsertId();

            // Cambiar estado de la mascota a 'en proceso' si estaba disponible
            if ($mascota['estado_adopcion'] === 'disponible') {
                $stmtUpdateM = $pdo->prepare("UPDATE mascotas SET estado_adopcion = 'en proceso' WHERE id = ?");
                $stmtUpdateM->execute([$datos['mascota_id']]);
            }

            http_response_code(201);
            echo json_encode([
                "mensaje" => "Solicitud de adopción registrada exitosamente.",
                "id" => $solicitudId
            ]);
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
        break;

    case 'PUT':
        $datos = json_decode(file_get_contents("php://input"), true);
        $id = $datos['id'] ?? ($_GET['id'] ?? null);

        if (empty($id) || empty($datos['estado_solicitud'])) {
            http_response_code(400);
            echo json_encode(["error" => "Se requiere el ID de la solicitud y el nuevo estado_solicitud."]);
            exit;
        }

        $nuevoEstado = $datos['estado_solicitud'];
        if (!in_array($nuevoEstado, ['pendiente', 'aprobada', 'rechazada'])) {
            http_response_code(400);
            echo json_encode(["error" => "Estado de solicitud no válido. Use: pendiente, aprobada o rechazada."]);
            exit;
        }

        try {
            // Consultar la solicitud existente
            $stmtCheck = $pdo->prepare("SELECT * FROM adopciones WHERE id = ?");
            $stmtCheck->execute([$id]);
            $solicitud = $stmtCheck->fetch();

            if (!$solicitud) {
                http_response_code(404);
                echo json_encode(["error" => "Solicitud de adopción no encontrada."]);
                exit;
            }

            // Actualizar estado de la solicitud
            $stmtUpdate = $pdo->prepare("UPDATE adopciones SET estado_solicitud = ? WHERE id = ?");
            $stmtUpdate->execute([$nuevoEstado, $id]);

            $mascotaId = $solicitud['mascota_id'];

            // Actualizar estado de la mascota según la decisión
            if ($nuevoEstado === 'aprobada') {
                $stmtM = $pdo->prepare("UPDATE mascotas SET estado_adopcion = 'adoptado' WHERE id = ?");
                $stmtM->execute([$mascotaId]);
            } elseif ($nuevoEstado === 'rechazada') {
                // Verificar si hay otras solicitudes pendientes o aprobadas para la misma mascota
                $stmtOtras = $pdo->prepare("SELECT COUNT(*) FROM adopciones WHERE mascota_id = ? AND estado_solicitud IN ('pendiente', 'aprobada') AND id != ?");
                $stmtOtras->execute([$mascotaId, $id]);
                $cantOtras = $stmtOtras->fetchColumn();

                if ($cantOtras == 0) {
                    $stmtM = $pdo->prepare("UPDATE mascotas SET estado_adopcion = 'disponible' WHERE id = ?");
                    $stmtM->execute([$mascotaId]);
                }
            }

            echo json_encode(["mensaje" => "Estado de solicitud actualizado a '$nuevoEstado'."]);
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
            echo json_encode(["error" => "Se requiere el ID de la solicitud a eliminar."]);
            exit;
        }

        try {
            $stmtCheck = $pdo->prepare("SELECT * FROM adopciones WHERE id = ?");
            $stmtCheck->execute([$id]);
            $solicitud = $stmtCheck->fetch();

            if (!$solicitud) {
                http_response_code(404);
                echo json_encode(["error" => "Solicitud no encontrada."]);
                exit;
            }

            $mascotaId = $solicitud['mascota_id'];

            $stmtDel = $pdo->prepare("DELETE FROM adopciones WHERE id = ?");
            $stmtDel->execute([$id]);

            // Si no quedan solicitudes para la mascota, restaurar estado a disponible
            $stmtOtras = $pdo->prepare("SELECT COUNT(*) FROM adopciones WHERE mascota_id = ? AND estado_solicitud IN ('pendiente', 'aprobada')");
            $stmtOtras->execute([$mascotaId]);
            if ($stmtOtras->fetchColumn() == 0) {
                $stmtM = $pdo->prepare("UPDATE mascotas SET estado_adopcion = 'disponible' WHERE id = ?");
                $stmtM->execute([$mascotaId]);
            }

            echo json_encode(["mensaje" => "Solicitud de adopción eliminada correctamente."]);
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