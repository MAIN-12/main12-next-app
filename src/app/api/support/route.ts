import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"
import { put } from "@vercel/blob"

// Define feedbackConfig or import it if it exists in another module
const feedbackConfig = {
  collectSystemInfo: true, // Example value, adjust as needed
}

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

// Helper function to generate a ticket number
const generateTicketNumber = (type: string): string => {
  const prefix = type === "bug" ? "BUG-" : type === "suggestion" ? "SUG-" : "SUP-"
  const timestamp = Date.now().toString(36).toUpperCase()
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${prefix}${timestamp.slice(-4)}${randomChars}`
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
 *                   type: string
 *                   example: "SUP-ABC1XYZ2"
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
export async function POST(request: Request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    console.log("Support API POST request received")
    // Parse JSON request body
    const body = await request.json()
    console.log("Original request body:", JSON.stringify(body, null, 2))

    // Extract fields needed for the database table structure
    const app_name = body.app_name
    const type = body.type || "bug"
    const title = body.title || "Untitled Request"
    let status = body.status || "pending"

    // Extract client timestamp for processing time calculation
    const clientTimestamp = body.client_timestamp || Date.now()
    const processingStartTime = Date.now()

    // Validate that the status is a valid enum value
    const validStatusQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumtypid = 'feedback_status'::regtype 
        AND enumlabel = $1
      );
    `

    const statusValidResult = await executeQuery(validStatusQuery, [status])
    if (!statusValidResult.rows[0].exists) {
      // Default to pending if invalid status
      status = "pending"
      console.warn(`Invalid status value: ${body.status}, defaulting to 'pending'`)
    }

    // Basic validation
    if (!app_name || !title || !body.description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders })
    }

    // Use provided ticket number or generate a new one
    const ticketId = body.ticketNumber || generateTicketNumber(type)

    // Handle file uploads if any
    const files = body.files || []
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

    // Create a deep copy of the original request body to preserve ALL fields
    const dataObject = JSON.parse(JSON.stringify(body))

    // Update the files array with the uploaded file information
    dataObject.files = fileUploads

    // IMPORTANT: Make sure we're not losing console_logs and system_info
    // These should already be in dataObject since we did a deep copy of body
    // But let's log to verify they're present
    console.log("Console logs present:", !!dataObject.console_logs)
    console.log("System info present:", !!dataObject.system_info)

    // Calculate processing time
    const processingEndTime = Date.now()
    const processingTime = processingEndTime - processingStartTime
    const totalProcessingTime = processingEndTime - clientTimestamp

    // Add timing metadata
    dataObject.timing = {
      client_timestamp: clientTimestamp,
      server_start_timestamp: processingStartTime,
      server_end_timestamp: processingEndTime,
      server_processing_time_ms: processingTime,
      total_processing_time_ms: totalProcessingTime,
    }

    // Add metadata
    dataObject.metadata = {
      ...(dataObject.metadata || {}),
      userAgent: request.headers.get("user-agent"),
      timestamp: new Date().toISOString(),
    }

    // Log the entire data object structure (but not the full content) to debug
    console.log("Data object structure:", Object.keys(dataObject))
    if (dataObject.console_logs) {
      console.log(
        "Console logs structure:",
        typeof dataObject.console_logs,
        typeof dataObject.console_logs === "object" ? Object.keys(dataObject.console_logs) : "not an object",
      )
    }
    if (dataObject.system_info) {
      console.log(
        "System info structure:",
        typeof dataObject.system_info,
        typeof dataObject.system_info === "object" ? Object.keys(dataObject.system_info) : "not an object",
      )
    }

    console.log("Final data object to be stored:", JSON.stringify(dataObject, null, 2))

    // Insert into database with title as a separate column
    const insertQuery = `
      INSERT INTO feedback (id, app, type, title, status, data)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at;
    `

    const result = await executeQuery(insertQuery, [
      ticketId,
      app_name,
      type,
      title,
      status,
      JSON.stringify(dataObject),
    ])
    const feedbackId = result.rows[0].id
    const createdAt = result.rows[0].created_at

    console.log("Database insert successful, ID:", feedbackId)

    return NextResponse.json(
      {
        success: true,
        id: feedbackId,
        title: title,
        created_at: createdAt,
        message: "Feedback submitted successfully",
        processing_time_ms: processingTime,
        total_processing_time_ms: totalProcessingTime,
      },
      { status: 200, headers: corsHeaders },
    )
  } catch (error) {
    console.error("Failed to submit feedback:", error)
    // Return more detailed error information for debugging
    return NextResponse.json(
      {
        error: "Failed to submit feedback",
        details: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500, headers: corsHeaders },
    )
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
 *         name: title
 *         schema:
 *           type: string
 *         description: Search by title (partial match)
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
 *                         type: string
 *                       app:
 *                         type: string
 *                       type:
 *                         type: string
 *                       title:
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
    const titleSearch = searchParams.get("title")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    let query = `
      SELECT id, app, type, title, status, data, notes, created_at, modified_at
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

    if (titleSearch) {
      conditions.push(`title ILIKE $${paramIndex}`)
      values.push(`%${titleSearch}%`) // ILIKE for case-insensitive search with wildcards
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
    return NextResponse.json(
      {
        error: "Failed to retrieve feedback",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: corsHeaders },
    )
  }
}

