import { db } from '@/db'
import { customers } from '@/db/schema'
import { CreateCustomerRequest } from '@/types/api'
import { count, like, or } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/customers - Get all customers with search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    let whereClause = undefined

    if (search) {
      whereClause = or(
        like(customers.name, `%${search}%`),
        like(customers.email, `%${search}%`),
        like(customers.phoneNumber, `%${search}%`)
      )
    }

    const [customerList, totalCount] = await Promise.all([
      db.query.customers.findMany({
        where: whereClause,
        with: {
          visitingCards: true,
          orders: {
            limit: 5,
            orderBy: (orders, { desc }) => [desc(orders.createdAt)]
          }
        },
        limit,
        offset,
        orderBy: (customers, { desc }) => [desc(customers.createdAt)]
      }),
      db.select({ count: count() })
        .from(customers)
        .where(whereClause)
        .then(res => res[0]?.count || 0)
    ])

    return NextResponse.json({
      customers: customerList,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

// POST /api/customers - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body: CreateCustomerRequest = await request.json()

    if (!body.name) {
      return NextResponse.json(
        { error: 'Customer name is required' },
        { status: 400 }
      )
    }

    const [newCustomer] = await db.insert(customers).values({
      name: body.name,
      address: body.address,
      phoneNumber: body.phoneNumber,
      email: body.email
    }).returning()

    return NextResponse.json(newCustomer, { status: 201 })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}