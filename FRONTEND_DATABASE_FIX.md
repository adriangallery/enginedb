# Fix: Database "not available" en Frontend

## Problema

El código intenta usar `Database.query()` antes de que termine de conectarse, causando:
```
⚠️ Database not available
```

## Solución: Agregar método waitForReady()

### 1. Actualizar lib/database.js

Agrega este método al inicio de tu clase/módulo Database:

```javascript
// database.js

class DatabaseAPI {
  constructor() {
    this.ready = false;
    this.readyPromise = null;
    this.tables = [];
    this.API_URL = 'https://enginedb-production.up.railway.app';
  }

  /**
   * Espera a que la Database esté lista
   * @returns {Promise<void>}
   */
  async waitForReady() {
    if (this.ready) {
      return Promise.resolve();
    }

    // Si ya hay un readyPromise en curso, reutilizarlo
    if (this.readyPromise) {
      return this.readyPromise;
    }

    // Crear nuevo readyPromise
    this.readyPromise = new Promise((resolve) => {
      const checkReady = () => {
        if (this.ready) {
          resolve();
        } else {
          setTimeout(checkReady, 50); // Check cada 50ms
        }
      };
      checkReady();
    });

    return this.readyPromise;
  }

  /**
   * Inicializar conexión
   */
  async connect() {
    console.log('🔌 Conectando con Database API...');

    try {
      const tables = await this.getTables();
      this.tables = tables;
      this.ready = true;
      console.log(`✅ Database API conectada (${tables.length} tablas disponibles)`);
    } catch (error) {
      console.error('❌ Error conectando con Database API:', error);
      throw error;
    }
  }

  /**
   * Query con auto-wait
   */
  async query(sql, params = []) {
    // Esperar a que esté ready antes de hacer query
    await this.waitForReady();

    try {
      const response = await fetch(`${this.API_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, params })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Query error:', error);
      return [];
    }
  }

  // ... resto de métodos
}

// Crear instancia y exponer globalmente
window.Database = new DatabaseAPI();

// Iniciar conexión automáticamente
window.Database.connect().catch(err => {
  console.error('Failed to connect to Database:', err);
});

console.log('📚 Database API Client cargado');
console.log('   URL:', window.Database.API_URL);
console.log('   Uso: await window.Database.query("SELECT * FROM table")');
```

### 2. Usar en tu código de market

Opción A - Esperar explícitamente:

```javascript
async function loadListingsFromDatabase() {
  console.log('📦 Cargando listings desde Database...');

  // Esperar a que Database esté lista
  await window.Database.waitForReady();

  const listings = await window.Database.query(`
    SELECT * FROM punk_listings
    WHERE is_listed = 1
    ORDER BY CAST(price_wei AS REAL) ASC
  `);

  return listings;
}
```

Opción B - El método query() ya espera automáticamente:

```javascript
async function loadListingsFromDatabase() {
  console.log('📦 Cargando listings desde Database...');

  // query() esperará automáticamente a que esté ready
  const listings = await window.Database.query(`
    SELECT * FROM punk_listings
    WHERE is_listed = 1
    ORDER BY CAST(price_wei AS REAL) ASC
  `);

  return listings;
}
```

### 3. Alternativa: Inicializar antes de cargar datos

En tu código principal:

```javascript
// market.js o app.js

async function initializeApp() {
  console.log('🚀 Iniciando aplicación...');

  // 1. Esperar a que Database esté lista
  await window.Database.waitForReady();
  console.log('✅ Database lista');

  // 2. Ahora cargar datos
  await loadNFTs();
  await loadListings();

  console.log('✅ Aplicación cargada');
}

// Iniciar cuando DOM esté ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
```

## Resultado Esperado

Logs correctos después del fix:

```
📚 Database API Client cargado
🔌 Conectando con Database API...
✅ Database API conectada (27 tablas disponibles)
🚀 Iniciando aplicación...
✅ Database lista
📦 Cargando listings desde Database...
✅ 43 listings cargados
```

## Verificar que Funciona

En la consola del navegador:

```javascript
// Verificar que Database está ready
console.log('Ready?', window.Database.ready); // true

// Probar query
const listings = await window.Database.query('SELECT * FROM punk_listings LIMIT 5');
console.log('Listings:', listings);
```

## Bonus: Mostrar Loading State

Mientras Database se conecta, muestra un indicador:

```javascript
async function loadListingsFromDatabase() {
  if (!window.Database.ready) {
    console.log('⏳ Esperando Database...');
    showLoadingSpinner('Conectando con base de datos...');
  }

  await window.Database.waitForReady();
  hideLoadingSpinner();

  const listings = await window.Database.query(/* ... */);
  return listings;
}
```
