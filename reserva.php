<?php
// reserva.php
include 'conexion.php'; // Incluye el archivo de conexión

$package = null;
$services = [];
$totalBase = 0;

// Obtener el ID del paquete de la URL
if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    $packageId = (int)$_GET['id'];

    // Obtener detalles del paquete
    $stmt = $conn->prepare("SELECT ID_Paquete, Nombre, Destino, Descripcion, Precio_Base FROM paquete_turistico WHERE ID_Paquete = ?");
    $stmt->bind_param("i", $packageId);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($result->num_rows > 0) {
        $package = $result->fetch_assoc();
        $totalBase = (float) $package['Precio_Base'];
    }
    $stmt->close();

    // Obtener servicios adicionales para este paquete
    $stmt = $conn->prepare("SELECT ID_Servicio, Tipo, Descripcion, Precio FROM servicio_adicional WHERE ID_Paquete = ?");
    $stmt->bind_param("i", $packageId);
    $stmt->execute();
    $result = $stmt->get_result();
    while($row = $result->fetch_assoc()) {
        $services[] = $row;
    }
    $stmt->close();

} else {
    // Si no se proporcionó un ID válido, redirige o muestra un error
    header("Location: index.php"); // Redirige al catálogo
    exit();
}

$conn->close();

if (!$package) {
    // Si el paquete no se encontró en la base de datos
    echo "<!DOCTYPE html><html lang='es'><head><meta charset='UTF-8'><title>Error</title>";
    echo "<script src='https://cdn.tailwindcss.com'></script></head><body class='flex items-center justify-center h-screen bg-gray-100'>";
    echo "<div class='bg-white p-8 rounded-lg shadow-md text-center'>";
    echo "<h1 class='text-2xl font-bold text-red-600 mb-4'>Paquete no encontrado</h1>";
    echo "<p class='text-gray-700 mb-6'>El paquete turístico solicitado no existe o no está disponible.</p>";
    echo "<a href='index.php' class='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors'>Volver al Catálogo</a>";
    echo "</div></body></html>";
    exit();
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservar: <?php echo htmlspecialchars($package['Nombre']); ?></title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f0f2f5;
        }
        .message-box {
            @apply fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50;
        }
        .message-content {
            @apply bg-white p-6 rounded-lg shadow-xl text-center;
        }
    </style>
</head>
<body class="p-6">
    <div class="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-6 text-center">Confirmar Reserva de Paquete</h1>

        <div class="mb-8">
            <h2 class="text-2xl font-semibold text-blue-600 mb-4"><?php echo htmlspecialchars($package['Nombre']); ?></h2>
            <p class="text-gray-700 mb-2"><strong>Destino:</strong> <?php echo htmlspecialchars($package['Destino']); ?></p>
            <p class="text-gray-700 mb-4"><?php echo htmlspecialchars($package['Descripcion']); ?></p>
            <p class="text-gray-900 text-xl font-bold">Precio Base: $<?php echo number_format($package['Precio_Base'], 2, ',', '.'); ?> ARS</p>
        </div>

        <h2 class="text-2xl font-semibold text-gray-800 mb-4">Seleccionar Servicios Adicionales</h2>
        <form id="bookingForm" class="space-y-4">
            <input type="hidden" id="packageId" value="<?php echo htmlspecialchars($package['ID_Paquete']); ?>">
            <input type="hidden" id="basePrice" value="<?php echo htmlspecialchars($package['Precio_Base']); ?>">

            <?php if (count($services) > 0): ?>
                <?php foreach ($services as $service): ?>
                    <div class="flex items-center bg-gray-50 p-4 rounded-lg shadow-sm">
                        <input type="checkbox" id="service_<?php echo htmlspecialchars($service['ID_Servicio']); ?>"
                               name="services[]" value="<?php echo htmlspecialchars($service['ID_Servicio']); ?>"
                               data-price="<?php echo htmlspecialchars($service['Precio']); ?>"
                               class="h-5 w-5 text-blue-600 rounded focus:ring-blue-500">
                        <label for="service_<?php echo htmlspecialchars($service['ID_Servicio']); ?>" class="ml-3 text-lg font-medium text-gray-800 flex-grow">
                            <?php echo htmlspecialchars($service['Tipo']); ?>: <?php echo htmlspecialchars($service['Descripcion']); ?>
                        </label>
                        <span class="text-gray-700 font-semibold text-lg">$<?php echo number_format($service['Precio'], 2, ',', '.'); ?> ARS</span>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <p class="text-gray-600 italic">No hay servicios adicionales disponibles para este paquete.</p>
            <?php endif; ?>

            <div class="mt-8 pt-4 border-t border-gray-200">
                <p class="text-2xl font-bold text-gray-900 text-right">
                    Total Estimado: <span id="totalPrice">$<?php echo number_format($totalBase, 2, ',', '.'); ?> ARS</span>
                </p>
            </div>

            <div class="flex justify-end space-x-4 mt-6">
                <a href="index.php" class="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors duration-200">
                    Cancelar
                </a>
                <button type="submit" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors duration-200">
                    Confirmar Reserva
                </button>
            </div>
        </form>
    </div>

    <!-- Contenedor para el cuadro de mensaje personalizado -->
    <div id="messageBox" class="message-box hidden">
        <div class="message-content">
            <p id="messageText" class="text-lg font-medium text-gray-800 mb-4"></p>
            <button id="closeMessage" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Cerrar</button>
        </div>
    </div>

    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const bookingForm = document.getElementById("bookingForm");
            const packageIdInput = document.getElementById("packageId");
            const basePriceInput = document.getElementById("basePrice");
            const serviceCheckboxes = document.querySelectorAll('input[name="services[]"]');
            const totalPriceSpan = document.getElementById("totalPrice");

            const messageBox = document.getElementById("messageBox");
            const messageText = document.getElementById("messageText");
            const closeMessageButton = document.getElementById("closeMessage");

            // Función para mostrar mensajes personalizados
            function showMessage(message) {
                messageText.textContent = message;
                messageBox.classList.remove('hidden');
            }

            // Event listener para cerrar el cuadro de mensaje
            closeMessageButton.addEventListener('click', () => {
                messageBox.classList.add('hidden');
                // Opcional: Recargar la página o redirigir después de un mensaje de éxito
                if (messageText.textContent.includes("éxito")) {
                     window.location.href = "index.php"; // Redirige al catálogo
                }
            });

            // Función para calcular y actualizar el precio total
            function updateTotalPrice() {
                let currentTotal = parseFloat(basePriceInput.value);
                serviceCheckboxes.forEach(checkbox => {
                    if (checkbox.checked) {
                        currentTotal += parseFloat(checkbox.dataset.price);
                    }
                });
                totalPriceSpan.textContent = `$${currentTotal.toFixed(2).replace('.', ',')} ARS`;
            }

            // Actualizar el total cuando se seleccionan/deseleccionan servicios
            serviceCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', updateTotalPrice);
            });

            // Inicializar el total al cargar la página
            updateTotalPrice();

            // Manejar el envío del formulario de reserva
            bookingForm.addEventListener("submit", async (e) => {
                e.preventDefault();

                const selectedServices = Array.from(serviceCheckboxes)
                    .filter(checkbox => checkbox.checked)
                    .map(checkbox => checkbox.value);

                // Aquí necesitarías el ID del usuario logueado.
                // Por ahora, usamos un ID fijo (ID_Usuario = 3) como ejemplo.
                // En una aplicación real, este ID vendría de la sesión del usuario.
                const userId = 3;

                const bookingData = {
                    id_usuario: userId,
                    id_paquete: packageIdInput.value,
                    servicios: selectedServices.join(',') // Cadena de IDs de servicios separados por coma
                };

                try {
                    const response = await fetch('procesar_reserva.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(bookingData)
                    });

                    const result = await response.json();

                    if (result.success) {
                        showMessage("¡Reserva realizada con éxito! Total: " + result.total);
                    } else {
                        showMessage("Error al procesar la reserva: " + result.message);
                    }
                } catch (error) {
                    console.error("Error en la solicitud de reserva:", error);
                    showMessage("Error de conexión al servidor. Inténtalo de nuevo.");
                }
            });
        });
    </script>
</body>
</html>
