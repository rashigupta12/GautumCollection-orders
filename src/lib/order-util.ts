/* eslint-disable @typescript-eslint/no-explicit-any */
import { DB } from '@/db'
import { orders } from '@/db/schema'
import { and, count, gte, lte } from 'drizzle-orm'

/**
 * Generates a unique order number in the format #YYYY-MM-DD-XXXX
 */
export async function generateOrderNumber(db: DB): Promise<string> {
  const today = new Date()
  const datePart = today.toISOString().split('T')[0].replace(/-/g, '-') // YYYY-MM-DD
  
  // Get the count of orders created today
  const startOfDay = new Date(today)
  startOfDay.setHours(0, 0, 0, 0)
  
  const endOfDay = new Date(today)
  endOfDay.setHours(23, 59, 59, 999)
  
  const todaysOrders = await db.select({ count: count() })
    .from(orders)
    .where(and(
      gte(orders.createdAt, startOfDay),
      lte(orders.createdAt, endOfDay)
    ))
  
  const sequenceNumber = (todaysOrders[0]?.count || 0) + 1
  const sequencePart = sequenceNumber.toString().padStart(4, '0')
  
  return `#${datePart}-${sequencePart}`
}

/**
 * Validates if all delivery requirements are met
 */
export function validateDeliveryRequirements(
  status: string, 
  billNumber?: string | null, 
  transportName?: string | null, 
  billPhotos?: any[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (status === 'DELIVERED') {
    if (!billNumber || billNumber.trim() === '') {
      errors.push('Bill number is required for delivered orders')
    }
    if (!transportName || transportName.trim() === '') {
      errors.push('Transport name is required for delivered orders')
    }
    if (!billPhotos || billPhotos.length === 0) {
      errors.push('At least one bill photo is required for delivered orders')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Extracts bill photos from order images
 */
export function getBillPhotos(images: any[]): any[] {
  return images.filter(img => img.type === 'BILL_PHOTO')
}

/**
 * Extracts order images (non-bill photos) from order images
 */
export function getOrderImages(images: any[]): any[] {
  return images.filter(img => img.type === 'ORDER_IMAGE')
}