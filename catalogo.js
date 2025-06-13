document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("offers");

  const productos = [
    { titulo: "Lorem Ipsum", precioOriginal: "$1000,00", precioDescuento: "$500,00", ubicacion: "Argentina" },
    { titulo: "Lorem Ipsum", precioOriginal: "$1000,00", precioDescuento: "$500,00", ubicacion: "Argentina" },
    { titulo: "Lorem Ipsum", precioOriginal: "$1000,00", precioDescuento: "$500,00", ubicacion: "Argentina" },
    { titulo: "Lorem Ipsum", precioOriginal: "$1000,00", precioDescuento: "$500,00", ubicacion: "Argentina" },
  ];

  productos.forEach(producto => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="https://via.placeholder.com/300x160" alt="${producto.titulo}" />
      <div class="card-body">
        <h3>${producto.titulo}</h3>
        <p>${producto.ubicacion}</p>
        <p class="price">
          <del>${producto.precioOriginal}</del> ${producto.precioDescuento}
          <span style="color:lime"> (En oferta)</span>
        </p>
        <button onclick="reservar('${producto.titulo}')">Reservar</button>
      </div>
    `;

    container.appendChild(card);
  });
});

function reservar(nombre) {
  alert(`Reservaste: ${nombre}`);
  // Aquí también podrías usar una llamada a Node.js o PHP
}
