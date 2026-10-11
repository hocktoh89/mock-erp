import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import * as path from 'path';
import * as sqlite3 from 'sqlite3';

export interface ProductERP {
  sku: string;
  name: string;
  price: number;
  currency: string;
  stockQuantity: number;
  availability: boolean;
}

@Injectable()
export class ErpService implements OnModuleDestroy {
  private readonly db: sqlite3.Database;

  private readonly seedProducts: ProductERP[] = [
    {
      sku: 'SKU-1001',
      name: 'Wireless Mechanical Keyboard',
      price: 129.99,
      currency: 'USD',
      stockQuantity: 45,
      availability: true,
    },
    {
      sku: 'SKU-1002',
      name: 'Ergonomic Vertical Mouse',
      price: 59.99,
      currency: 'USD',
      stockQuantity: 120,
      availability: true,
    },
    {
      sku: 'SKU-1003',
      name: 'Ultrawide 34-inch Monitor',
      price: 499.0,
      currency: 'USD',
      stockQuantity: 8,
      availability: true,
    },
  ];

  constructor() {
    const dbPath = path.join(process.cwd(), 'erp.db');
    this.db = new sqlite3.Database(dbPath, (error) => {
      if (error) {
        console.error('Failed to initialize ERP SQLite database', error);
        throw error;
      }
    });

    this.initializeDatabase();
  }

  onModuleDestroy() {
    this.db.close();
  }

  private initializeDatabase(): void {
    this.db.serialize(() => {
      this.db.run(`
        CREATE TABLE IF NOT EXISTS products (
          sku TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          currency TEXT NOT NULL,
          stock_qty INTEGER NOT NULL,
          availability INTEGER NOT NULL DEFAULT 1
        )
      `);

      const insertProduct = this.db.prepare(`
        INSERT OR IGNORE INTO products (
          sku,
          name,
          price,
          currency,
          stock_qty,
          availability
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const product of this.seedProducts) {
        insertProduct.run(
          product.sku,
          product.name,
          product.price,
          product.currency,
          product.stockQuantity,
          product.availability,
        );
      }

      insertProduct.finalize();
    });
  }

  private mapRow(row: any): ProductERP {
    return {
      sku: row.sku,
      name: row.name,
      price: Number(row.price),
      currency: row.currency,
      stockQuantity: Number(row.stock_qty),
      availability: Boolean(row.availability),
    };
  }

  async getProduct(sku: string): Promise<ProductERP> {
    const normalizedSku = sku.toUpperCase().trim();

    return new Promise((resolve, reject) => {
      this.db.get('SELECT * FROM products WHERE sku = ?', [normalizedSku], (error, row: any) => {
        if (error) {
          return reject(error);
        }

        if (!row) {
          return reject(new NotFoundException(`Product with SKU '${sku}' not found in ERP.`));
        }

        return resolve(this.mapRow(row));
      });
    });
  }

  async getProductAvailableQty(sku: string, stockQty: number): Promise<ProductERP> {
    const normalizedSku = sku.toUpperCase().trim();
    const requestedQty = Math.max(0, Number(stockQty) || 0);

    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM products WHERE sku = ? AND ? <= stock_qty',
        [normalizedSku, requestedQty],
        (error, row: any) => {
          if (error) {
            return reject(error);
          }

          if (!row) {
            const notFoundMessage =
              requestedQty === 0
                ? `Requested quantity is invalid for SKU '${sku}'.`
                : `Requested quantity ${requestedQty} is not available for SKU '${sku}'.`;

            return reject(new NotFoundException(notFoundMessage));
          }

          return resolve(this.mapRow(row));
        },
      );
    });
  }

  async getBatchProducts(skus: string[]): Promise<ProductERP[]> {
    const normalizedSkus = [...new Set(skus.map((sku) => sku.toUpperCase().trim()).filter(Boolean))];

    if (normalizedSkus.length === 0) {
      return [];
    }

    const placeholders = normalizedSkus.map(() => '?').join(', ');

    return new Promise((resolve, reject) => {
      this.db.all(`SELECT * FROM products WHERE sku IN (${placeholders})`, normalizedSkus, (error, rows: any[]) => {
        if (error) {
          return reject(error);
        }

        return resolve((rows || []).map((row) => this.mapRow(row)));
      });
    });
  }

  async updateProductStock(sku: string, stockQuantity: number): Promise<ProductERP> {
    const normalizedSku = sku.toUpperCase().trim();
    const normalizedStockQuantity = Math.max(0, Number(stockQuantity) || 0);
    const availability = normalizedStockQuantity === 0 ? 0 : 1;
    const db = this.db;
    const service = this;

    return new Promise((resolve, reject) => {
      db.run(
        'UPDATE products SET stock_qty = ?, availability = ? WHERE sku = ?',
        [normalizedStockQuantity, availability, normalizedSku],
        function (error) {
          if (error) {
            return reject(error);
          }

          if (this.changes === 0) {
            return reject(new NotFoundException(`Product with SKU '${sku}' not found in ERP.`));
          }

          db.get('SELECT * FROM products WHERE sku = ?', [normalizedSku], (selectError, row: any) => {
            if (selectError) {
              return reject(selectError);
            }

            return resolve(service.mapRow(row));
          });
        },
      );
    });
  }
}