/* eslint-disable @typescript-eslint/no-empty-object-type */
// types/api.ts
import { Customer, Order, OrderImage, CustomerVisitingCard, OrderStatus } from '@/db/schema';

export interface CreateCustomerRequest {
  name: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
}

export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {}

export interface CreateOrderRequest {
  customerId: number;
  notes?: string;
  audioUrl?: string;
  images?: Array<{
    imageUrl: string;
    remark?: string;
  }>;
}

export interface UpdateOrderRequest {
  notes?: string;
  audioUrl?: string;
  status?: OrderStatus;
  billNumber?: string;
  transportName?: string;
}

export interface AddOrderImagesRequest {
  images: Array<{
    imageUrl: string;
    remark?: string;
  }>;
}

export interface AddBillPhotosRequest {
  billPhotos: Array<{
    imageUrl: string;
  }>;
}

export interface DeliverOrderRequest {
  billNumber: string;
  transportName: string;
  billPhotos: Array<{
    imageUrl: string;
  }>;
}

export interface CustomerWithRelations extends Customer {
  visitingCards: CustomerVisitingCard[];
  orders: Order[];
}

export interface OrderWithRelations extends Order {
  customer: Customer;
  images: OrderImage[];
  orderImages: OrderImage[];
  billPhotos: OrderImage[];
}