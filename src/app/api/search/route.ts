/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '@/db'
import { customers, orderImages, orders } from '@/db/schema'
import { eq, like, or } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/search - Global search across customers and orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const type = searchParams.get('type') || 'all' // 'all', 'customers', 'orders'
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const results = {
      customers: [] as any[],
      orders: [] as any[]
    }

    if (type === 'all' || type === 'customers') {
      results.customers = await db.select()
        .from(customers)
        .where(or(
          like(customers.name, `%${query}%`),
          like(customers.email, `%${query}%`),
          like(customers.phoneNumber, `%${query}%`)
        ))
        .limit(limit)
    }

    if (type === 'all' || type === 'orders') {
      const orderResults = await db.select({
        order: orders,
        customer: customers
      })
        .from(orders)
        .where(or(
          like(orders.orderNumber, `%${query}%`),
          like(orders.billNumber, `%${query}%`),
          like(orders.transportName, `%${query}%`),
          like(customers.name, `%${query}%`),
          like(customers.email, `%${query}%`),
          like(customers.phoneNumber, `%${query}%`)
        ))
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .limit(limit)

      results.orders = await Promise.all(
        orderResults.map(async ({ order, customer }) => {
          const images = await db.select()
            .from(orderImages)
            .where(eq(orderImages.orderId, order.id))
            .limit(3)

          return {
            ...order,
            customer,
            images
          }
        })
      )
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error searching:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}