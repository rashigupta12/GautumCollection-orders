import { db } from '@/db'
import { orderImages, orders } from '@/db/schema'
import { validateDeliveryRequirements } from '@/lib/order-util'
import { AddOrderImagesRequest, DeliverOrderRequest, UpdateOrderRequest } from '@/types/api'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/orders/[id] - Get order by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderId = BigInt(id)

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        customer: true,
        images: true
      }
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    const orderImagesList = order.images || []
    const orderWithRelations = {
      ...order,
      orderImages: orderImagesList.filter(img => img.type === 'ORDER_IMAGE'),
      billPhotos: orderImagesList.filter(img => img.type === 'BILL_PHOTO')
    }

    return NextResponse.json(orderWithRelations)
  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Invalid order ID or failed to fetch order' },
      { status: 500 }
    )
  }
}

// PUT /api/orders/[id] - Update order
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderId = BigInt(id)
    const body: UpdateOrderRequest = await request.json()

    const [updatedOrder] = await db.update(orders)
      .set({
        notes: body.notes,
        audioUrl: body.audioUrl,
        status: body.status,
        billNumber: body.billNumber,
        transportName: body.transportName,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning()

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

// POST /api/orders/[id]/images - Add order images
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderId = BigInt(id)
    const body: AddOrderImagesRequest = await request.json()

    if (!body.images || body.images.length === 0) {
      return NextResponse.json(
        { error: 'Images are required' },
        { status: 400 }
      )
    }

    // Create the values array with proper typing
    const values = body.images.map(image => ({
      orderId: orderId,
      imageUrl: image.imageUrl,
      remark: image.remark,
      type: 'ORDER_IMAGE' as const,
      uploadedAt: new Date()
    }))

    const newImages = await db.insert(orderImages)
      .values(values)
      .returning()

    return NextResponse.json(newImages, { status: 201 })
  } catch (error) {
    console.error('Error adding order images:', error)
    return NextResponse.json(
      { error: 'Failed to add order images' },
      { status: 500 }
    )
  }
}

// PATCH /api/orders/[id]/deliver - Deliver order (changed from POST to PATCH)
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderId = BigInt(id)
    const body: DeliverOrderRequest = await request.json()

    // Validate delivery requirements
    const validation = validateDeliveryRequirements(
      'DELIVERED',
      body.billNumber,
      body.transportName,
      body.billPhotos
    )

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    // Update order status and delivery info
    const [updatedOrder] = await db.update(orders)
      .set({
        status: 'DELIVERED',
        billNumber: body.billNumber,
        transportName: body.transportName,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId))
      .returning()

    if (!updatedOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Add bill photos
    if (body.billPhotos && body.billPhotos.length > 0) {
      const billPhotoValues = body.billPhotos.map(photo => ({
        orderId: orderId,
        imageUrl: photo.imageUrl,
        type: 'BILL_PHOTO' as const,
        uploadedAt: new Date()
      }))

      await db.insert(orderImages)
        .values(billPhotoValues)
    }

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error delivering order:', error)
    return NextResponse.json(
      { error: 'Failed to deliver order' },
      { status: 500 }
    )
  }
}