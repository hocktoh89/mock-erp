import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { ErpService, ProductERP } from './erp.service';
import { BatchStockDto } from './dto/batch-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Controller('api/v1/products')
export class ErpController {
  constructor(private readonly erpService: ErpService) {}

  @Get(':sku')
  async getProduct(@Param('sku') sku: string): Promise<ProductERP> {
    return this.erpService.getProduct(sku);
  }

  @Get(':sku/qty/:qty')
  async getProductQtyAvailability(@Param('sku') sku: string, @Param('qty') qty: number): Promise<ProductERP> {
    return this.erpService.getProductAvailableQty(sku, qty);
  }


  @Post('batch')
  async getBatchProducts(
    @Body() batchStockDto: BatchStockDto,
  ): Promise<{ products: ProductERP[] }> {
    const products = await this.erpService.getBatchProducts(batchStockDto.skus);
    return { products };
  }

  @Patch(':sku/stock')
  async updateProductStock(
    @Param('sku') sku: string,
    @Body() updateStockDto: UpdateStockDto,
  ): Promise<ProductERP> {
    return this.erpService.updateProductStock(sku, updateStockDto.stockQuantity);
  }
}
