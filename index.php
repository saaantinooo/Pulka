<?php
// index.php
// Incluye el archivo de conexión a la base de datos
include 'conexion.php';

$ofertas = []; // Array para almacenar los datos de los paquetes turísticos

// Consulta para obtener los paquetes turísticos disponibles
// Aquí asumimos que Precio_Base es el precio en oferta, y el Precio_Original es un 20% más alto.
// Idealmente, deberías tener una columna `Precio_Oferta` o `Porcentaje_Descuento` en tu tabla `paquete_turistico`.
$sql = "SELECT ID_Paquete, Nombre, Destino, Descripcion, Precio_Base FROM paquete_turistico WHERE Disponible = 1";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    while($row = $result->fetch_assoc()) {
        $precioBase = (float) $row['Precio_Base'];
        $precioOriginal = $precioBase * 1.20; // Asumimos un 20% de descuento sobre el precio original

        // Determinar si hay descuento para mostrar "En oferta"
        // Si Precio_Base es menor que Precio_Original (calculado), entonces está en oferta
        $tieneDescuento = ($precioBase < $precioOriginal);

        $ofertas[] = [
            'id' => $row['ID_Paquete'],
            'titulo' => $row['Nombre'],
            'ubicacion' => $row['Destino'],
            'descripcion' => $row['Descripcion'], // Agregamos la descripción para el detalle
            'precioBase' => number_format($precioBase, 2, ',', '.') . ' ARS', // Formato para pesos argentinos
            'precioOriginal' => number_format($precioOriginal, 2, ',', '.') . ' ARS', // Formato para pesos argentinos
            'descuento' => $tieneDescuento
        ];
    }
} else {
    // Si no hay resultados o hay un error en la consulta
    error_log("Error al obtener paquetes: " . $conn->error);
}

// Cierra la conexión a la base de datos
$conn->close();
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Catálogo de Paquetes Turísticos</title>
    <!-- Incluye Tailwind CSS desde CDN para estilos rápidos -->
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f0f2f5;
        }
        .card {
            @apply bg-white rounded-xl shadow-md overflow-hidden transform transition-transform duration-300 hover:scale-105;
        }
        .card-body {
            @apply p-4;
        }
        .price del {
            @apply text-gray-500 line-through mr-2;
        }
        .price span {
            @apply font-semibold text-xl text-green-600;
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
    <div class="max-w-7xl mx-auto">
        <h1 class="text-4xl font-bold text-center text-gray-800 mb-8 rounded-lg p-4 bg-white shadow-sm">Nuestros Paquetes Turísticos</h1>

        <!-- Formulario de búsqueda -->
        <form id="searchForm" class="mb-8 p-6 bg-white rounded-xl shadow-md flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4">
            <input type="text" id="searchQuery" placeholder="Buscar por destino o nombre..."
                   class="flex-grow p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto">
            <button type="submit" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 w-full md:w-auto">
                Buscar
            </button>
        </form>

        <div id="offers" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <!-- Las tarjetas de los paquetes se cargarán aquí -->
        </div>
    </div>

    <!-- Contenedor para el cuadro de mensaje personalizado -->
    <div id="messageBox" class="message-box hidden">
        <div class="message-content">
            <p id="messageText" class="text-lg font-medium text-gray-800 mb-4"></p>
            <button id="closeMessage" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Cerrar</button>
        </div>
    </div>

    <script>
        // Pasa los datos de PHP a JavaScript
        const productosData = <?php echo json_encode($ofertas); ?>;

        document.addEventListener("DOMContentLoaded", () => {
            const offersContainer = document.getElementById("offers");
            const searchForm = document.getElementById("searchForm");
            const searchQueryInput = document.getElementById("searchQuery");
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
            });

            // Función para renderizar las tarjetas
            function renderCards(data) {
                offersContainer.innerHTML = ''; // Limpia el contenedor antes de renderizar
                if (data.length === 0) {
                    offersContainer.innerHTML = '<p class="text-center text-gray-600 col-span-full">No se encontraron paquetes con esos criterios de búsqueda.</p>';
                    return;
                }
                data.forEach(producto => {
                    const card = document.createElement("div");
                    card.className = "card"; // Clases base para la tarjeta

                    card.innerHTML = `
                        <img src="https://placehold.co/300x160/2563eb/ffffff?text=${encodeURIComponent(producto.titulo)}" alt="${producto.titulo}" class="w-full h-40 object-cover rounded-t-xl" />
                        <div class="card-body">
                            <h3 class="text-xl font-semibold text-gray-900 mb-2">${producto.titulo}</h3>
                            <p class="text-gray-600 text-sm mb-2">${producto.ubicacion}</p>
                            <p class="text-gray-700 text-base mb-4">${producto.descripcion.substring(0, 100)}...</p> <!-- Muestra solo una parte de la descripción -->
                            <p class="price mb-4">
                                ${producto.descuento ? `<del>${producto.precioOriginal}</del>` : ''}
                                <span class="${producto.descuento ? 'text-green-600' : 'text-blue-600'} font-bold text-2xl">${producto.precioBase}</span>
                                ${producto.descuento ? "<span class='text-lime-600 font-medium ml-2'>(En oferta)</span>" : ""}
                            </p>
                            <button onclick="reservar(${producto.id})"
                                class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors duration-200 w-full">
                                Reservar
                            </button>
                        </div>
                    `;
                    offersContainer.appendChild(card);
                });
            }

            // Renderiza todas las tarjetas al cargar la página
            renderCards(productosData);

            // Manejador del formulario de búsqueda
            searchForm.addEventListener("submit", async (e) => {
                e.preventDefault();
                const query = searchQueryInput.value.trim();

                if (query === "") {
                    renderCards(productosData); // Muestra todos los productos si la búsqueda está vacía
                    return;
                }

                try {
                    // Realiza una petición fetch a un endpoint PHP para buscar paquetes
                    const response = await fetch(`buscar_paquetes.php?query=${encodeURIComponent(query)}`);
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const searchResults = await response.json();
                    renderCards(searchResults); // Renderiza los resultados de la búsqueda
                } catch (error) {
                    console.error("Error al buscar paquetes:", error);
                    showMessage("Error al realizar la búsqueda. Inténtalo de nuevo más tarde.");
                    renderCards([]); // Muestra un array vacío para indicar que no hay resultados o hubo un error
                }
            });
        });

        // La función reservar ahora redirige a una página de detalle de reserva
        function reservar(packageId) {
            // Redirige al usuario a una página de reserva detallada
            // Donde podrá ver más información del paquete y servicios adicionales.
            window.location.href = `reserva.php?id=${packageId}`;
        }
    </script>
</body>
</html>
