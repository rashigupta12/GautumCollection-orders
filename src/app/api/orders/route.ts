import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { orders, customers, orderImages, OrderStatus } from '@/db/schema'
import { eq, like, or, and, between, desc, count } from 'drizzle-orm'
import { CreateOrderRequest } from '@/types/api'
import { generateOrderNumber } from '@/lib/order-util'

// GET /api/orders - Get all orders with search and filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') as OrderStatus | null
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    const whereConditions = []

    if (search) {
      whereConditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(orders.billNumber, `%${search}%`),
          like(orders.transportName, `%${search}%`),
          like(customers.name, `%${search}%`),
          like(customers.email, `%${search}%`),
          like(customers.phoneNumber, `%${search}%`)
        )
      )
    }

    if (status) {
      whereConditions.push(eq(orders.status, status))
    }

    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      whereConditions.push(between(orders.createdAt, start, end))
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

    const [orderList, totalCountResult] = await Promise.all([
      db.select({
        order: orders,
        customer: customers
      })
        .from(orders)
        .where(whereClause)
        .leftJoin(customers, eq(orders.customerId, customers.id))
        .limit(limit)
        .offset(offset)
        .orderBy(desc(orders.createdAt)),
      db.select({ count: count() })
        .from(orders)
        .where(whereClause)
    ])

    const totalCount = totalCountResult[0]?.count || 0

    const ordersWithRelations = await Promise.all(
      orderList.map(async ({ order, customer }) => {
        const images = await db.select()
          .from(orderImages)
          .where(eq(orderImages.orderId, order.id))

        return {
          ...order,
          customer,
          images,
          orderImages: images.filter(img => img.type === 'ORDER_IMAGE'),
          billPhotos: images.filter(img => img.type === 'BILL_PHOTO')
        }
      })
    )

    return NextResponse.json({
      orders: ordersWithRelations,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json()

    if (!body.customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const orderNumber = await generateOrderNumber(db)

    // Convert customerId to BigInt if it's a number
    const customerId = typeof body.customerId === 'number' 
      ? BigInt(body.customerId) 
      : body.customerId

    const [newOrder] = await db.insert(orders).values({
      orderNumber,
      customerId: customerId,
      notes: body.notes,
      audioUrl: body.audioUrl,
      status: 'CREATED' as const
    }).returning()

    // Add order images if provided
    if (body.images && body.images.length > 0) {
      const imageValues = body.images.map(image => ({
        orderId: newOrder.id,
        imageUrl: image.imageUrl,
        remark: image.remark,
        type: 'ORDER_IMAGE' as const,
        uploadedAt: new Date()
      }))

      await db.insert(orderImages).values(imageValues)
    }

    // Fetch the complete order with relations
    const completeOrder = await db.query.orders.findFirst({
      where: eq(orders.id, newOrder.id),
      with: {
        customer: true,
        images: true
      }
    })

    return NextResponse.json(completeOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}