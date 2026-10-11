import { Injectable, NotFoundException } from '@nestjs/common';

export interface ProductERP {
  sku: string;
  name: string;
  price: number;
  currency: string;
  stockLevel: number;
  warehouseLocation: string;
}

@Injectable()
export class ErpService {
  private readonly erpDatabase: Record<string, ProductERP> = {
    "SKU-1001": {
      sku: "SKU-1001",
      name: "Wireless Mechanical Keyboard",
      price: 129.99,
      currency: "USD",
      stockLevel: 45,
      warehouseLocation: "WH-EAST-01",
    },
    "SKU-1002": {
      sku: "SKU-1002",
      name: "Ergonomic Vertical Mouse",
      price: 59.99,
      currency: "USD",
      stockLevel: 120,
      warehouseLocation: "WH-WEST-02",
    },
    "SKU-1003": {
      sku: "SKU-1003",
      name: "Ultrawide 34-inch Monitor",
      price: 499.00,
      currency: "USD",
      stockLevel: 8,
      warehouseLocation: "WH-EAST-01",
    },
  };

  getProduct(sku: string): ProductERP {
    const normalizedSku = sku.toUpperCase();
    const product = this.erpDatabase[normalizedSku];
    if (!product) {
      throw new NotFoundException(`Product with SKU '${sku}' not found in ERP.`);
    }
    return product;
  }

  getBatchProducts(skus: string[]): ProductERP[] {
    const found: ProductERP[] = [];
    for (const sku of skus) {
      const normalizedSku = sku.toUpperCase();
      if (this.erpDatabase[normalizedSku]) {
        found.push(this.erpDatabase[normalizedSku]);
      }
    }
    return found;
  }
}