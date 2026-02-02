/**
 * Módulo de base de datos para el frontend
 *
 * Este archivo se puede copiar directamente a tu proyecto frontend (Next.js, React, etc.)
 * como lib/database.js o similar.
 *
 * Uso:
 *   import { query, getTables, getTableSchema } from '@/lib/database'
 *
 *   const trades = await query(
 *     'SELECT * FROM trade_events WHERE token_id = ? LIMIT 10',
 *     ['1234']
 *   )
 */

// IMPORTANTE: Reemplaza esta URL con tu URL de Railway
const API_URL = 'https://enginedb-production.up.railway.app';

/**
 * Ejecuta una consulta SQL de solo lectura
 *
 * @param {string} sql - La consulta SQL (solo SELECT permitido)
 * @param {Array} params - Parámetros para la consulta (opcional)
 * @returns {Promise<Array>} - Array de resultados
 *
 * @example
 * const trades = await query(
 *   'SELECT * FROM trade_events WHERE contract_address = ? ORDER BY block_number DESC LIMIT 10',
 *   ['0x...']
 * )
 */
export async function query(sql, params = []) {
  try {
    const response = await fetch(`${API_URL}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql, params })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Query failed');
    }

    return result.data || [];
  } catch (error) {
    console.error('Query error:', error);
    throw error; // Re-lanzar para que el componente pueda manejarlo
  }
}

/**
 * Obtiene la lista de todas las tablas disponibles
 *
 * @returns {Promise<Array<string>>} - Array de nombres de tablas
 *
 * @example
 * const tables = await getTables()
 * console.log('Tablas:', tables) // ['trade_events', 'listing_events', ...]
 */
export async function getTables() {
  try {
    const response = await fetch(`${API_URL}/query/tables`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.tables || [];
  } catch (error) {
    console.error('Error fetching tables:', error);
    return [];
  }
}

/**
 * Obtiene el schema (estructura de columnas) de una tabla
 *
 * @param {string} table - Nombre de la tabla
 * @returns {Promise<Array>} - Array de objetos con información de columnas
 *
 * @example
 * const schema = await getTableSchema('trade_events')
 * console.log('Columnas:', schema.map(col => col.name))
 */
export async function getTableSchema(table) {
  try {
    const response = await fetch(`${API_URL}/query/schema/${table}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return result.columns || [];
  } catch (error) {
    console.error(`Error fetching schema for table '${table}':`, error);
    return [];
  }
}

// ============================================================================
// QUERIES PRE-CONSTRUIDAS (HELPER FUNCTIONS)
// ============================================================================

/**
 * Obtiene los últimos trades de un contrato
 */
export async function getLatestTrades(contractAddress, limit = 10) {
  return query(
    'SELECT * FROM trade_events WHERE contract_address = ? ORDER BY block_number DESC LIMIT ?',
    [contractAddress, limit]
  );
}

/**
 * Obtiene todos los trades de un token específico
 */
export async function getTokenTrades(contractAddress, tokenId, limit = 50) {
  return query(
    'SELECT * FROM trade_events WHERE contract_address = ? AND token_id = ? ORDER BY block_number DESC LIMIT ?',
    [contractAddress, tokenId, limit]
  );
}

/**
 * Obtiene los listings activos ordenados por precio
 */
export async function getActiveListings(limit = 100) {
  return query(
    'SELECT * FROM punk_listings WHERE is_listed = 1 ORDER BY CAST(price AS REAL) ASC LIMIT ?',
    [limit]
  );
}

/**
 * Obtiene el listing actual de un punk específico
 */
export async function getPunkListing(punkId) {
  const results = await query(
    'SELECT * FROM punk_listings WHERE punk_id = ? AND is_listed = 1 LIMIT 1',
    [punkId]
  );
  return results[0] || null;
}

/**
 * Obtiene todos los transfers de un token
 */
export async function getTokenTransfers(contractAddress, tokenId, limit = 50) {
  return query(
    'SELECT * FROM erc721_transfers WHERE contract_address = ? AND token_id = ? ORDER BY block_number DESC LIMIT ?',
    [contractAddress, tokenId, limit]
  );
}

/**
 * Obtiene transfers de un wallet específico
 */
export async function getWalletTransfers(walletAddress, limit = 50) {
  return query(
    `SELECT * FROM erc721_transfers
     WHERE from_address = ? OR to_address = ?
     ORDER BY block_number DESC
     LIMIT ?`,
    [walletAddress, walletAddress, limit]
  );
}

/**
 * Obtiene estadísticas de volumen por contrato
 */
export async function getContractStats(contractAddress) {
  const results = await query(
    `SELECT
       COUNT(*) as total_trades,
       SUM(CAST(price AS REAL)) as total_volume,
       AVG(CAST(price AS REAL)) as avg_price,
       MIN(CAST(price AS REAL)) as min_price,
       MAX(CAST(price AS REAL)) as max_price
     FROM trade_events
     WHERE contract_address = ?`,
    [contractAddress]
  );
  return results[0] || null;
}

/**
 * Obtiene el floor price actual (listing más barato)
 */
export async function getFloorPrice() {
  const results = await query(
    `SELECT MIN(CAST(price AS REAL)) as floor_price
     FROM punk_listings
     WHERE is_listed = 1`
  );
  return results[0]?.floor_price || null;
}

/**
 * Busca eventos por hash de transacción
 */
export async function getEventsByTxHash(txHash) {
  // Buscar en todas las tablas de eventos
  const [trades, listings, transfers] = await Promise.all([
    query('SELECT * FROM trade_events WHERE tx_hash = ?', [txHash]),
    query('SELECT * FROM listing_events WHERE tx_hash = ?', [txHash]),
    query('SELECT * FROM erc721_transfers WHERE tx_hash = ?', [txHash])
  ]);

  return {
    trades,
    listings,
    transfers
  };
}

/**
 * Obtiene la actividad reciente (últimos eventos de todas las tablas)
 */
export async function getRecentActivity(limit = 20) {
  const results = await query(
    `SELECT
       'trade' as event_type,
       block_number,
       timestamp,
       tx_hash,
       token_id,
       price,
       from_address as from_addr,
       to_address as to_addr
     FROM trade_events
     UNION ALL
     SELECT
       'listing' as event_type,
       block_number,
       timestamp,
       tx_hash,
       punk_id as token_id,
       price,
       from_address as from_addr,
       to_address as to_addr
     FROM listing_events
     UNION ALL
     SELECT
       'transfer' as event_type,
       block_number,
       timestamp,
       tx_hash,
       token_id,
       NULL as price,
       from_address as from_addr,
       to_address as to_addr
     FROM erc721_transfers
     ORDER BY block_number DESC
     LIMIT ?`,
    [limit]
  );

  return results;
}

// ============================================================================
// EJEMPLO DE USO EN REACT/NEXT.JS
// ============================================================================

/*
// Ejemplo en un componente de React:

import { useEffect, useState } from 'react'
import { query, getLatestTrades, getFloorPrice } from '@/lib/database'

export default function TradesComponent() {
  const [trades, setTrades] = useState([])
  const [floorPrice, setFloorPrice] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        // Query personalizada
        const customTrades = await query(
          'SELECT * FROM trade_events WHERE price > ? ORDER BY block_number DESC LIMIT 10',
          ['1000000000000000000'] // 1 ETH en wei
        )

        // O usar helper function
        const latestTrades = await getLatestTrades('0x...', 10)

        // Obtener floor price
        const floor = await getFloorPrice()

        setTrades(latestTrades)
        setFloorPrice(floor)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <h1>Latest Trades</h1>
      <p>Floor Price: {floorPrice ? `${floorPrice} wei` : 'N/A'}</p>
      <ul>
        {trades.map(trade => (
          <li key={trade.id}>
            Token #{trade.token_id} - Price: {trade.price}
          </li>
        ))}
      </ul>
    </div>
  )
}
*/
