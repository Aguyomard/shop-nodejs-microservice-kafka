<template>
  <div id="app">
    <header class="header">
      <h1>🚀 Mon Projet Node.js + Vue 3</h1>
      <nav class="navigation">
        <router-link to="/" class="nav-link">🏠 Accueil</router-link>
        <router-link to="/kafka-test" class="nav-link"
          >🧪 Kafka Test</router-link
        >
        <router-link to="/clothing-shop" class="nav-link"
          >👕 Clothing Shop</router-link
        >
      </nav>
    </header>

    <main class="main">
      <router-view />
    </main>

    <footer class="footer">
      <p>Backend Node.js + Frontend Vue 3</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
// Le composant utilise maintenant le router-view pour afficher les pages
</script>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header h1 {
  margin: 0 0 1rem 0;
  font-size: 2.5rem;
  font-weight: 300;
}

.navigation {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  background: rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  font-weight: 500;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.main {
  flex: 1;
  padding: 2rem;
  background-color: #f8f9fa;
}

.footer {
  background-color: #343a40;
  color: white;
  text-align: center;
  padding: 1rem;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 2rem;
  }

  .navigation {
    flex-direction: column;
    align-items: center;
  }

  .nav-link {
    width: 200px;
    text-align: center;
  }
}
</style>
