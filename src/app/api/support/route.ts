import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { put } from "@vercel/blob"

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  })
}

/**
 * @swagger
 * /api/support:
 *   post:
 *     tags:
 *       - Support & Feedback
 *     summary: Submit feedback with optional file attachments
 *     description: Stores feedback in Postgres and uploads any attached files to Vercel Blob
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - app_name
 *               - title
 *               - description
 *             properties:
 *               app_name:
 *                 type: string
 *                 description: The name of the application
 *               type:
 *                 type: string
 *                 description: Type of feedback (bug, suggestion, support)
 *                 default: "bug"
 *               title:
 *                 type: string
 *                 description: The title of the feedback
 *               description:
 *                 type: string
 *                 description: Detailed description
 *               location:
 *                 type: string
 *                 description: The location or URL where the issue occurred
 *               user:
 *                 type: object
 *                 description: User information
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *               files:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - data
 *                   properties:
 *                     name:
 *                       type: string
 *                     type:
 *                       type: string
 *                     data:
 *                       type: string
 *                       format: base64
 *                 description: Array of files to be uploaded (base64 encoded)
 *           example:
 *             app_name: "test-app"
 *             type: "bug"
 *             title: "Test Bug Report"
 *             description: "This is a test bug report to verify the API works correctly."
 *             location: "https://example.com/test-page"
 *             user:
 *               name: "Test User"
 *               email: "test@example.com"
 *             files:
 *               - name: "test-image.png"
 *                 type: "image/png"
 *                 data: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=="
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *                   example: "2023-06-01T12:00:00Z"
 *                 message:
 *                   type: string
 *                   example: "Feedback submitted successfully"
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Missing required fields"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to submit feedback"
 */
// Update the POST function to accept JSON instead of FormData
export async function POST(request: Request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    // Parse JSON request body
    const body = await request.json()

    const app_name = body.app_name
    const type = body.type || "bug"
    const status = body.status || "pending"
    const title = body.title
    const description = body.description
    const location = body.location
    const user = body.user
    const files = body.files || []

    if (!app_name || !title || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders })
    }

    // Upload files to Vercel Blob if any
    const fileUploads = []
    if (files.length > 0) {
      for (const file of files) {
        try {
          // Check if file has the required properties
          if (!file.name || !file.data) {
            fileUploads.push({
              name: file.name || "unknown",
              error: "Invalid file format. Required: name and data",
            })
            continue
          }

          // Convert base64 to buffer
          const buffer = Buffer.from(file.data.replace(/^data:.*;base64,/, ""), "base64")

          // Create a Blob from the buffer
          const blob = await put(`feedback/${app_name}/${Date.now()}-${file.name}`, buffer, {
            access: "public",
            contentType: file.type || "application/octet-stream",
          })

          fileUploads.push({
            name: file.name,
            url: blob.url,
            size: buffer.length,
            type: file.type || "application/octet-stream",
          })
        } catch (error) {
          console.error(`Failed to upload file ${file.name}:`, error)
          fileUploads.push({
            name: file.name || "unknown",
            error: "Failed to upload file",
          })
        }
      }
    }

    // Prepare data for database
    const data = {
      title,
      description,
      location,
      user,
      files: fileUploads,
      metadata: {
        userAgent: request.headers.get("user-agent"),
        timestamp: new Date().toISOString(),
      },
    }

    // Insert into database with the new columns
    const insertQuery = `
      INSERT INTO feedback (app, type, status, data)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at;
    `

    const result = await executeQuery(insertQuery, [app_name, type, status, JSON.stringify(data)])
    const feedbackId = result.rows[0].id
    const createdAt = result.rows[0].created_at

    return NextResponse.json(
      {
        success: true,
        id: feedbackId,
        created_at: createdAt,
        message: "Feedback submitted successfully",
      },
      { status: 200, headers: corsHeaders },
    )
  } catch (error) {
    console.error("Failed to submit feedback:", error)
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500, headers: corsHeaders })
  }
}

/**
 * @swagger
 * /api/support:
 *   get:
 *     tags:
 *       - Support & Feedback
 *     summary: Get feedback entries
 *     description: Retrieves feedback entries with optional filtering by app
 *     parameters:
 *       - in: query
 *         name: app
 *         schema:
 *           type: string
 *         description: Filter by application name
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by feedback type (bug, suggestion, support)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (pending, in-progress, resolved, etc.)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit the number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Offset for pagination
 *     responses:
 *       200:
 *         description: List of feedback entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       app:
 *                         type: string
 *                       type:
 *                         type: string
 *                       status:
 *                         type: string
 *                       data:
 *                         type: object
 *                       notes:
 *                         type: array
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       modified_at:
 *                         type: string
 *                         format: date-time
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     hasMore:
 *                       type: boolean
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve feedback"
 */
export async function GET(request: Request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    const { searchParams } = new URL(request.url)
    const app = searchParams.get("app")
    const type = searchParams.get("type")
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = `
      SELECT id, app, type, status, data, notes, created_at, modified_at
      FROM feedback
    `

    const conditions = []
    const values = []
    let paramIndex = 1

    if (app) {
      conditions.push(`app = $${paramIndex}`)
      values.push(app)
      paramIndex++
    }

    if (type) {
      conditions.push(`type = $${paramIndex}`)
      values.push(type)
      paramIndex++
    }

    if (status) {
      conditions.push(`status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    values.push(limit, offset)

    const result = await executeQuery(query, values)

    return NextResponse.json(
      {
        success: true,
        data: result.rows,
        count: result.rowCount,
        pagination: {
          limit,
          offset,
          hasMore: result.rowCount === limit,
        },
      },
      { status: 200, headers: corsHeaders },
    )
  } catch (error) {
    console.error("Failed to retrieve feedback:", error)
    return NextResponse.json({ error: "Failed to retrieve feedback" }, { status: 500, headers: corsHeaders })
  }
}

