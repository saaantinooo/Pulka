document.addEventListener("DOMContentLoaded", async () => {
  const offersContainer = document.getElementById("offers");
  const API_BASE_URL = 'http://localhost/tu-proyecto/api.php'; // Cambia por tu URL
  
  let paquetesTuristicos = [];

  // Función para mostrar loading
  function mostrarLoading() {
    offersContainer.innerHTML = `
      <div class="loading">
        <h3>Cargando paquetes turísticos...</h3>
        <div class="spinner"></div>
      </div>
    `;
  }

  // Función para mostrar error
  function mostrarError(mensaje) {
    offersContainer.innerHTML = `
      <div class="error">
        <h3>Error al cargar los paquetes</h3>
        <p>${mensaje}</p>
        <button onclick="cargarPaquetes()">Reintentar</button>
      </div>
    `;
  }

  // Función para obtener imagen según destino
  function obtenerImagenDestino(destino) {
    const imagenes = {
      'El Calafate, Argentina': 'https://images.unsplash.com/photo-1544550285-f813152fb2fd?w=300&h=160&fit=crop',
      'Cancún, México': 'https://images.unsplash.com/photo-1512813195386-6cf811ad3542?w=300&h=160&fit=crop',
      'París, Francia': 'https://images.unsplash.com/photo-1502602898536-47ad22581b52?w=300&h=160&fit=crop',
      'Serengeti, Tanzania': 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=300&h=160&fit=crop',
      'Cusco, Perú': 'https://images.unsplash.com/photo-1587595431973-160d0d94add1?w=300&h=160&fit=crop',
      'Santorini, Grecia': 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=300&h=160&fit=crop',
      'La Fortuna, Costa Rica': 'https://images.unsplash.com/photo-1605538883669-825200433431?w=300&h=160&fit=crop',
      'Marrakech, Marruecos': 'https://images.unsplash.com/photo-1539650116574-75c0c6d90bf4?w=300&h=160&fit=crop'
    };
    return imagenes[destino] || 'https://via.placeholder.com/300x160';
  }

  // Función para formatear precio
  function formatearPrecio(precio) {
    return `$${precio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // Función para determinar si hay descuento
  function tieneDescuento(precio) {
    return precio < 1000;
  }

  // Función para cargar paquetes desde la API
  async function cargarPaquetes() {
    try {
      mostrarLoading();
      
      const response = await fetch(`${API_BASE_URL}/paquetes`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      paquetesTuristicos = data;
      
      if (paquetesTuristicos.length === 0) {
        offersContainer.innerHTML = `
          <div class="no-results">
            <h3>No hay paquetes disponibles</h3>
            <p>Vuelve pronto para ver nuevas ofertas</p>
          </div>
        `;
        return;
      }
      
      mostrarPaquetes(paquetesTuristicos);
      
    } catch (error) {
      console.error('Error al cargar paquetes:', error);
      mostrarError(error.message);
    }
  }

  // Función para mostrar paquetes en el DOM
  function mostrarPaquetes(paquetes) {
    offersContainer.innerHTML = '';
    
    paquetes.forEach(paquete => {
      const card = document.createElement("div");
      card.className = "card";
      
      const descuento = tieneDescuento(paquete.precio_base);
      const precioFormateado = formatearPrecio(paquete.precio_base);
      
      card.innerHTML = `
        <img src="${obtenerImagenDestino(paquete.destino)}" alt="${paquete.nombre}" />
        <div class="card-body">
          <h3>${paquete.nombre}</h3>
          <p class="destination">${paquete.destino}</p>
          <p class="description">${paquete.descripcion}</p>
          ${paquete.servicios_adicionales && paquete.servicios_adicionales.length > 0 ? `
            <div class="services">
              <h4>Servicios adicionales disponibles:</h4>
              <ul>
                ${paquete.servicios_adicionales.map(servicio => 
                  `<li><strong>${servicio.tipo}:</strong> ${servicio.descripcion} (+${formatearPrecio(servicio.precio)})</li>`
                ).join('')}
              </ul>
            </div>
          ` : ''}
          <p class="price">
            ${precioFormateado}
            ${descuento ? " <span class='discount'>(¡En oferta!)</span>" : ""}
          </p>
          <button onclick="reservar(${paquete.id}, '${paquete.nombre}', ${paquete.precio_base})" 
                  ${!paquete.disponible ? 'disabled' : ''}>
            ${paquete.disponible ? 'Reservar' : 'No disponible'}
          </button>
        </div>
      `;
      offersContainer.appendChild(card);
    });
  }

  // Función de búsqueda con API
  async function buscarPaquetes(query) {
    try {
      mostrarLoading();
      
      const response = await fetch(`${API_BASE_URL}/buscar?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        offersContainer.innerHTML = `
          <div class="no-results">
            <h3>No se encontraron resultados para: "${query}"</h3>
            <p>Intenta con otros términos de búsqueda</p>
            <button onclick="cargarPaquetes()">Ver todos los paquetes</button>
          </div>
        `;
        return;
      }
      
      mostrarPaquetes(data);
      
    } catch (error) {
      console.error('Error al buscar paquetes:', error);
      mostrarError('Error al realizar la búsqueda: ' + error.message);
    }
  }

  // Event listener para el formulario de búsqueda
  document.getElementById("searchForm").addEventListener("submit", e => {
    e.preventDefault();
    const query = e.target.query.value.trim();
    
    if (query === '') {
      cargarPaquetes();
      return;
    }
    
    buscarPaquetes(query);
  });

  // Hacer funciones disponibles globalmente
  window.cargarPaquetes = cargarPaquetes;
  window.buscarPaquetes = buscarPaquetes;

  // Cargar paquetes al iniciar
  await cargarPaquetes();
});

// Función de reserva con API
async function reservar(id, titulo, precio) {
  try {
    // Simulamos que tenemos un usuario logueado (en un caso real obtendrías esto de la sesión)
    const id_usuario = 3; // ID del usuario "tzaw" de tu base de datos
    
    const confirmacion = confirm(`
      ¿Confirmar reserva?
      
      Paquete: ${titulo}
      Precio: $${precio.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      
      ¿Proceder con la reserva?
    `);
    
    if (!confirmacion) return;
    
    const response = await fetch(`http://localhost/tu-proyecto/api.php/reservar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id_usuario: id_usuario,
        id_paquete: id,
        servicios_adicionales: [] // Aquí podrías agregar servicios seleccionados
      })
    });
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const resultado = await response.json();
    
    alert(`
      ¡Reserva confirmada!
      
      ID de reserva: ${resultado.id_reserva}
      Total pagado: $${resultado.total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      
      ¡Gracias por tu reserva!
    `);
    
  } catch (error) {
    console.error('Error al realizar la reserva:', error);
    alert('Error al procesar la reserva: ' + error.message);
  }
}

// Función para obtener detalles de un paquete específico
async function obtenerPaquete(id) {
  try {
    const response = await fetch(`http://localhost/tu-proyecto/api.php/paquete?id=${id}`);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    
    const paquete = await response.json();
    return paquete;
    
  } catch (error) {
    console.error('Error al obtener el paquete:', error);
    throw error;
  }
}
