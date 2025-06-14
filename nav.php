<header>
    <div class="logo">
        <a href="index.php"><h1>Pulca</h1></a>
    </div>

    <form id="searchForm">
        <input type="text" placeholder="Buscar..." name="query" id="searchInput" required />
    </form>

    <a href="login.php"><button class="InicioBtn">Inicio de Sesión</button></a>
    
    <a href="register.php"><button class="RegistroBtn">Registrarse</button></a>
</header>

<script>
    document.getElementById("searchForm").addEventListener("submit", function (e) {
        e.preventDefault();
        const query = document.getElementById("queryInput").value;
        if (query.trim() !== "") {
            window.location.href = `menu.html?query=${encodeURIComponent(query)}`;
        }
    });
</script>