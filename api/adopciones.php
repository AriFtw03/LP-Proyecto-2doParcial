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

function syncEstadoMascota(\PDO $pdo, int $mascotaId): void {
    $stmtLock = $pdo->prepare("SELECT id FROM mascotas WHERE id = ? FOR UPDATE");
    $stmtLock->execute([$mascotaId]);

    $stmtStatus = $pdo->prepare("
        SELECT 
            SUM(CASE WHEN estado_solicitud = 'aprobada' THEN 1 ELSE 0 END) as cant_aprobadas,
            SUM(CASE WHEN estado_solicitud = 'pendiente' THEN 1 ELSE 0 END) as cant_pendientes
        FROM adopciones 
        WHERE mascota_id = ?
    ");
    $stmtStatus->execute([$mascotaId]);
    $counts = $stmtStatus->fetch();
    $cantAprobadas = (int)($counts['cant_aprobadas'] ?? 0);
    $cantPendientes = (int)($counts['cant_pendientes'] ?? 0);

    if ($cantAprobadas > 0) {
        $nuevoEstado = 'adoptado';
    } elseif ($cantPendientes > 0) {
        $nuevoEstado = 'en proceso';
    } else {
        $nuevoEstado = 'disponible';
    }

    $stmtUpdate = $pdo->prepare("UPDATE mascotas SET estado_adopcion = ? WHERE id = ?");
    $stmtUpdate->execute([$nuevoEstado, $mascotaId]);
}

$metodo = $_SERVER['REQUEST_METHOD'];

switch ($metodo) {
    case 'GET':
        try {
            $selectBase = "SELECT a.*, 
                                  m.nombre AS mascota_nombre, 
                                  m.especie AS mascota_especie, 
                                  m.raza AS mascota_raza, 
                                  m.foto_url AS mascota_foto_url, 
                                  m.estado_salud AS mascota_estado_salud,
                                  m.estado_adopcion AS mascota_estado_adopcion
                           FROM adopciones a 
                           LEFT JOIN mascotas m ON a.mascota_id = m.id";

            if (isset($_GET['id'])) {
                $id = filter_var($_GET['id'], FILTER_VALIDATE_INT);
                if ($id === false || $id <= 0) {
                    http_response_code(400);
                    echo json_encode(["error" => "ID de solicitud no válido."]);
                    exit;
                }
                $stmt = $pdo->prepare("{$selectBase} WHERE a.id = ?");
                $stmt->execute([$id]);
                $solicitud = $stmt->fetch();
                if ($solicitud) {
                    echo json_encode($solicitud);
                } else {
                    http_response_code(404);
                    echo json_encode(["error" => "Solicitud de adopción no encontrada."]);
                }
            } else {
                $where = [];
                $params = [];

                if (isset($_GET['mascota_id'])) {
                    $mascotaId = filter_var($_GET['mascota_id'], FILTER_VALIDATE_INT);
                    if ($mascotaId === false || $mascotaId <= 0) {
                        http_response_code(400);
                        echo json_encode(["error" => "ID de mascota no válido."]);
                        exit;
                    }
                    $where[] = "a.mascota_id = ?";
                    $params[] = $mascotaId;
                }

                if (isset($_GET['estado_solicitud'])) {
                    $estado = trim($_GET['estado_solicitud']);
                    $permitidos = ['pendiente', 'aprobada', 'rechazada'];
                    if (!in_array($estado, $permitidos, true)) {
                        http_response_code(400);
                        echo json_encode(["error" => "Estado de solicitud no válido."]);
                        exit;
                    }
                    $where[] = "a.estado_solicitud = ?";
                    $params[] = $estado;
                }

                $query = $selectBase;
                if (!empty($where)) {
                    $query .= " WHERE " . implode(" AND ", $where);
                }
                $query .= " ORDER BY a.fecha_solicitud DESC";

                $stmt = $pdo->prepare($query);
                $stmt->execute($params);
                echo json_encode($stmt->fetchAll());
            }
        } catch (\PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => "Error interno al consultar solicitudes de adopción."]);
        }
        break;

    case 'POST':
        $datos = json_decode(file_get_contents("php://input"), true);
        if (!$datos || !is_array($datos)) {
            http_response_code(400);
            echo json_encode(["error" => "Cuerpo de solicitud JSON no válido."]);
            exit;
        }

        $mascotaId = filter_var($datos['mascota_id'] ?? null, FILTER_VALIDATE_INT);
        $nombreSolicitante = isset($datos['nombre_solicitante']) ? trim(strip_tags($datos['nombre_solicitante'])) : '';
        $correoContacto = isset($datos['correo_contacto']) ? trim($datos['correo_contacto']) : '';
        $telefonoContacto = isset($datos['telefono_contacto']) ? trim(strip_tags($datos['telefono_contacto'])) : '';
        $ciudadDireccion = isset($datos['ciudad_direccion']) ? trim(strip_tags($datos['ciudad_direccion'])) : '';
        $tipoVivienda = isset($datos['tipo_vivienda']) ? trim($datos['tipo_vivienda']) : '';
        $tienePatioEspacio = (!empty($datos['tiene_patio_espacio']) && ($datos['tiene_patio_espacio'] === true || $datos['tiene_patio_espacio'] === 1 || $datos['tiene_patio_espacio'] === '1' || $datos['tiene_patio_espacio'] === 'true')) ? 1 : 0;
        $otrasMascotas = (!empty($datos['otras_mascotas']) && ($datos['otras_mascotas'] === true || $datos['otras_mascotas'] === 1 || $datos['otras_mascotas'] === '1' || $datos['otras_mascotas'] === 'true')) ? 1 : 0;
        $descripcionOtrasMascotas = isset($datos['descripcion_otras_mascotas']) ? trim(strip_tags($datos['descripcion_otras_mascotas'])) : null;
        $experienciaPrevia = isset($datos['experiencia_previa']) ? trim($datos['experiencia_previa']) : 'ha_tenido_antes';
        $motivoAdopcion = isset($datos['motivo_adopcion']) ? trim(strip_tags($datos['motivo_adopcion'])) : '';
        $estadoSolicitud = isset($datos['estado_solicitud']) ? trim($datos['estado_solicitud']) : 'pendiente';

        // Validaciones de obligatoriedad y tipos
        if ($mascotaId === false || $mascotaId <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "El ID de la mascota es requerido y debe ser un entero positivo."]);
            exit;
        }

        if (empty($nombreSolicitante) || mb_strlen($nombreSolicitante) > 100) {
            http_response_code(400);
            echo json_encode(["error" => "El nombre del solicitante es requerido y no debe exceder 100 caracteres."]);
            exit;
        }

        if (empty($correoContacto) || mb_strlen($correoContacto) > 100 || !filter_var($correoContacto, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["error" => "El correo electrónico no tiene un formato válido o excede 100 caracteres."]);
            exit;
        }

        // Validación de formato de teléfono (entre 7 y 20 caracteres con dígitos válidos)
        $telefonoValido = preg_match('/^[+0-9\s\-().]{7,20}$/', $telefonoContacto) &&
                          preg_match_all('/[0-9]/', $telefonoContacto, $mDigitos) >= 7;
        if (!$telefonoValido) {
            http_response_code(400);
            echo json_encode(["error" => "El teléfono de contacto no es válido (se requieren entre 7 y 20 dígitos o caracteres permitidos)."]);
            exit;
        }

        if (empty($ciudadDireccion) || mb_strlen($ciudadDireccion) > 150) {
            http_response_code(400);
            echo json_encode(["error" => "La ciudad y dirección son requeridas y no deben exceder 150 caracteres."]);
            exit;
        }

        $tiposViviendaPermitidos = ['casa_propia', 'casa_alquiler', 'departamento_propio', 'departamento_alquiler', 'otro'];
        if (!in_array($tipoVivienda, $tiposViviendaPermitidos, true)) {
            http_response_code(400);
            echo json_encode(["error" => "El tipo de vivienda no es válido. Opciones permitidas: " . implode(', ', $tiposViviendaPermitidos)]);
            exit;
        }

        if ($otrasMascotas === 1 && !empty($descripcionOtrasMascotas)) {
            if (mb_strlen($descripcionOtrasMascotas) > 200) {
                http_response_code(400);
                echo json_encode(["error" => "La descripción de otras mascotas no debe exceder 200 caracteres."]);
                exit;
            }
        } elseif ($otrasMascotas === 0) {
            $descripcionOtrasMascotas = null;
        }

        $experienciasPermitidas = ['primera_vez', 'ha_tenido_antes', 'cuidador_experimentado'];
        if (!in_array($experienciaPrevia, $experienciasPermitidas, true)) {
            http_response_code(400);
            echo json_encode(["error" => "El nivel de experiencia previa no es válido. Opciones permitidas: " . implode(', ', $experienciasPermitidas)]);
            exit;
        }

        if (empty($motivoAdopcion)) {
            http_response_code(400);
            echo json_encode(["error" => "El motivo de adopción es obligatorio."]);
            exit;
        }

        $estadosPermitidos = ['pendiente', 'aprobada', 'rechazada'];
        if (!in_array($estadoSolicitud, $estadosPermitidos, true)) {
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

            $sql = "INSERT INTO adopciones (
                mascota_id, 
                nombre_solicitante, 
                correo_contacto, 
                telefono_contacto, 
                ciudad_direccion, 
                tipo_vivienda, 
                tiene_patio_espacio, 
                otras_mascotas, 
                descripcion_otras_mascotas, 
                experiencia_previa, 
                motivo_adopcion, 
                estado_solicitud
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $mascotaId,
                mb_substr($nombreSolicitante, 0, 100),
                mb_substr($correoContacto, 0, 100),
                mb_substr($telefonoContacto, 0, 20),
                mb_substr($ciudadDireccion, 0, 150),
                $tipoVivienda,
                $tienePatioEspacio,
                $otrasMascotas,
                (!empty($descripcionOtrasMascotas) && $otrasMascotas === 1) ? mb_substr($descripcionOtrasMascotas, 0, 200) : null,
                $experienciaPrevia,
                $motivoAdopcion,
                $estadoSolicitud
            ]);
            $solicitudId = (int) $pdo->lastInsertId();

            syncEstadoMascota($pdo, $mascotaId);

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
        if (!$datos || !is_array($datos)) {
            http_response_code(400);
            echo json_encode(["error" => "Cuerpo de solicitud JSON no válido."]);
            exit;
        }

        $rawId = $datos['id'] ?? ($_GET['id'] ?? null);
        $id = filter_var($rawId, FILTER_VALIDATE_INT);

        if ($id === false || $id <= 0) {
            http_response_code(400);
            echo json_encode(["error" => "Se requiere un ID numérico válido para actualizar la solicitud."]);
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

            // Preparar campos a actualizar
            $campos = [];
            $params = [];

            if (isset($datos['estado_solicitud'])) {
                $nuevoEstado = trim($datos['estado_solicitud']);
                $permitidos = ['pendiente', 'aprobada', 'rechazada'];
                if (!in_array($nuevoEstado, $permitidos, true)) {
                    $pdo->rollBack();
                    http_response_code(400);
                    echo json_encode(["error" => "Estado de solicitud no válido. Valores admitidos: pendiente, aprobada, rechazada."]);
                    exit;
                }

                if ($nuevoEstado === 'aprobada') {
                    $stmtOtherApproved = $pdo->prepare("SELECT COUNT(*) FROM adopciones WHERE mascota_id = ? AND estado_solicitud = 'aprobada' AND id != ?");
                    $stmtOtherApproved->execute([$mascotaId, $id]);
                    if ((int)$stmtOtherApproved->fetchColumn() > 0) {
                        $pdo->rollBack();
                        http_response_code(400);
                        echo json_encode(["error" => "La mascota ya cuenta con una solicitud aprobada previa."]);
                        exit;
                    }

                    // Cascada automática: Rechazar las demás solicitudes 'pendiente' para esta mascota
                    $stmtCascade = $pdo->prepare("
                        UPDATE adopciones 
                        SET estado_solicitud = 'rechazada' 
                        WHERE mascota_id = ? AND id != ? AND estado_solicitud = 'pendiente'
                    ");
                    $stmtCascade->execute([$mascotaId, $id]);
                }

                $campos[] = "estado_solicitud = ?";
                $params[] = $nuevoEstado;
            } else {
                $nuevoEstado = null;
            }

            if (isset($datos['nombre_solicitante'])) {
                $nom = trim(strip_tags($datos['nombre_solicitante']));
                if (empty($nom) || mb_strlen($nom) > 100) {
                    $pdo->rollBack();
                    http_response_code(400);
                    echo json_encode(["error" => "Nombre del solicitante inválido."]);
                    exit;
                }
                $campos[] = "nombre_solicitante = ?";
                $params[] = mb_substr($nom, 0, 100);
            }

            if (isset($datos['correo_contacto'])) {
                $correo = trim($datos['correo_contacto']);
                if (empty($correo) || mb_strlen($correo) > 100 || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
                    $pdo->rollBack();
                    http_response_code(400);
                    echo json_encode(["error" => "Correo de contacto inválido."]);
                    exit;
                }
                $campos[] = "correo_contacto = ?";
                $params[] = mb_substr($correo, 0, 100);
            }

            if (isset($datos['telefono_contacto'])) {
                $tel = trim(strip_tags($datos['telefono_contacto']));
                $telefonoValido = preg_match('/^[+0-9\s\-().]{7,20}$/', $tel) &&
                                  preg_match_all('/[0-9]/', $tel, $mDigitos) >= 7;
                if (!$telefonoValido) {
                    $pdo->rollBack();
                    http_response_code(400);
                    echo json_encode(["error" => "Teléfono de contacto inválido."]);
                    exit;
                }
                $campos[] = "telefono_contacto = ?";
                $params[] = mb_substr($tel, 0, 20);
            }

            if (isset($datos['ciudad_direccion'])) {
                $cd = trim(strip_tags($datos['ciudad_direccion']));
                if (empty($cd) || mb_strlen($cd) > 150) {
                    $pdo->rollBack();
                    http_response_code(400);
                    echo json_encode(["error" => "Ciudad y dirección inválidas."]);
                    exit;
                }
                $campos[] = "ciudad_direccion = ?";
                $params[] = mb_substr($cd, 0, 150);
            }

            if (isset($datos['tipo_vivienda'])) {
                $tv = trim($datos['tipo_vivienda']);
                $tiposPermitidos = ['casa_propia', 'casa_alquiler', 'departamento_propio', 'departamento_alquiler', 'otro'];
                if (!in_array($tv, $tiposPermitidos, true)) {
                    $pdo->rollBack();
                    http_response_code(400);
                    echo json_encode(["error" => "Tipo de vivienda inválido."]);
                    exit;
                }
                $campos[] = "tipo_vivienda = ?";
                $params[] = $tv;
            }

            if (isset($datos['tiene_patio_espacio'])) {
                $patio = (!empty($datos['tiene_patio_espacio']) && ($datos['tiene_patio_espacio'] === true || $datos['tiene_patio_espacio'] === 1 || $datos['tiene_patio_espacio'] === '1' || $datos['tiene_patio_espacio'] === 'true')) ? 1 : 0;
                $campos[] = "tiene_patio_espacio = ?";
                $params[] = $patio;
            }

            if (isset($datos['otras_mascotas'])) {
                $om = (!empty($datos['otras_mascotas']) && ($datos['otras_mascotas'] === true || $datos['otras_mascotas'] === 1 || $datos['otras_mascotas'] === '1' || $datos['otras_mascotas'] === 'true')) ? 1 : 0;
                $campos[] = "otras_mascotas = ?";
                $params[] = $om;
                if ($om === 0 && !isset($datos['descripcion_otras_mascotas'])) {
                    $campos[] = "descripcion_otras_mascotas = ?";
                    $params[] = null;
                }
            }

            if (isset($datos['descripcion_otras_mascotas'])) {
                $descOm = trim(strip_tags($datos['descripcion_otras_mascotas']));
                if (!empty($descOm) && mb_strlen($descOm) > 200) {
                    $pdo->rollBack();
                    http_response_code(400);
                    echo json_encode(["error" => "Descripción de otras mascotas no debe exceder 200 caracteres."]);
                    exit;
                }
                $isOm = isset($om) ? $om : (int)$solicitud['otras_mascotas'];
                $campos[] = "descripcion_otras_mascotas = ?";
                $params[] = ($isOm === 1 && !empty($descOm)) ? mb_substr($descOm, 0, 200) : null;
            }

            if (isset($datos['experiencia_previa'])) {
                $exp = trim($datos['experiencia_previa']);
                $expPermitidas = ['primera_vez', 'ha_tenido_antes', 'cuidador_experimentado'];
                if (!in_array($exp, $expPermitidas, true)) {
                    $pdo->rollBack();
                    http_response_code(400);
                    echo json_encode(["error" => "Nivel de experiencia no válido."]);
                    exit;
                }
                $campos[] = "experiencia_previa = ?";
                $params[] = $exp;
            }

            if (isset($datos['motivo_adopcion'])) {
                $motivo = trim(strip_tags($datos['motivo_adopcion']));
                if (empty($motivo)) {
                    $pdo->rollBack();
                    http_response_code(400);
                    echo json_encode(["error" => "El motivo de adopción no puede estar vacío."]);
                    exit;
                }
                $campos[] = "motivo_adopcion = ?";
                $params[] = $motivo;
            }

            if (empty($campos)) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(["error" => "No se enviaron campos válidos para actualizar."]);
                exit;
            }

            $sql = "UPDATE adopciones SET " . implode(", ", $campos) . " WHERE id = ?";
            $params[] = $id;
            $stmtUpdate = $pdo->prepare($sql);
            $stmtUpdate->execute($params);

            // Sincronizar estado de la mascota con las solicitudes activas
            syncEstadoMascota($pdo, $mascotaId);

            $pdo->commit();

            echo json_encode(["mensaje" => "Solicitud de adopción actualizada exitosamente."]);
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

            // Sincronizar estado de la mascota tras eliminar la solicitud
            syncEstadoMascota($pdo, $mascotaId);

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