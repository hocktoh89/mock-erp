import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ErpService, ProductERP } from './erp.service';
import { BatchStockDto } from './dto/batch-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Controller('api/v1/products')
export class ErpController {
  constructor(private readonly erpService: ErpService) {}

  // Middleware/Interceptor simulation via helper inside endpoints for fault injection
  private async simulateFaults(simulateLatency?: string, simulateError?: string) {
    if (simulateLatency) {
      const delay = Math.min(Number(simulateLatency) * 1000, 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (simulateError) {
      const errorCode = Number(simulateError);
      throw new HttpException(
        { error: `Simulated ERP failure with status ${errorCode}` },
        isNaN(errorCode) ? HttpStatus.INTERNAL_SERVER_ERROR : errorCode,
      );
    }
  }

  @Get(':sku')
  async getProduct(
    @Param('sku') sku: string,
    @Headers('x-simulate-latency') simulateLatency?: string,
    @Headers('x-simulate-error') simulateError?: string,
  ): Promise<ProductERP> {
    await this.simulateFaults(simulateLatency, simulateError);
    return this.erpService.getProduct(sku);
  }

  @Post('batch')
  async getBatchProducts(
    @Body() batchStockDto: BatchStockDto,
    @Headers('x-simulate-latency') simulateLatency?: string,
    @Headers('x-simulate-error') simulateError?: string,
  ): Promise<{ products: ProductERP[] }> {
    await this.simulateFaults(simulateLatency, simulateError);
    const products = await this.erpService.getBatchProducts(batchStockDto.skus);
    return { products };
  }

  @Patch(':sku/stock')
  async updateProductStock(
    @Param('sku') sku: string,
    @Body() updateStockDto: UpdateStockDto,
    @Headers('x-simulate-latency') simulateLatency?: string,
    @Headers('x-simulate-error') simulateError?: string,
  ): Promise<ProductERP> {
    await this.simulateFaults(simulateLatency, simulateError);
    return this.erpService.updateProductStock(sku, updateStockDto.stockQuantity);
  }
}
