import { type NextRequest, NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  })
}

/**
 * @swagger
 * /api/support/{id}:
 *   get:
 *     tags:
 *       - Support & Feedback
 *     summary: Get a specific feedback entry
 *     description: Retrieves a feedback entry by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback entry
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    const { id } = await context.params

    const query = `
      SELECT id, app, type, title, status, data, notes, created_at, modified_at
      FROM feedback
      WHERE id = $1
    `

    const result = await executeQuery(query, [id])

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404, headers: corsHeaders })
    }

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 200, headers: corsHeaders })
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

/**
 * @swagger
 * /api/support/{id}:
 *   patch:
 *     tags:
 *       - Support & Feedback
 *     summary: Update a feedback entry
 *     description: Updates a feedback entry by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Updated title
 *               status:
 *                 type: string
 *                 enum: [pending, inReview, resolved, wontFix, duplicate, inProgress, waiting, blocked, completed, migrated, archived, spam, acknowledged, implemented, escalated, customerResponse]
 *                 description: Updated status
 *               data:
 *                 type: object
 *                 description: Updated data
 *               notes:
 *                 type: array
 *                 description: Updated notes
 *     responses:
 *       200:
 *         description: Feedback updated successfully
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    const { id } = await context.params

    const { type, title, status, data, notes } = await request.json()

    // Check if feedback exists
    const checkQuery = `SELECT id FROM feedback WHERE id = $1`
    const checkResult = await executeQuery(checkQuery, [id])

    if (checkResult.rowCount === 0) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404, headers: corsHeaders })
    }

    // Build update query based on provided fields
    let updateQuery = `UPDATE feedback SET modified_at = CURRENT_TIMESTAMP`
    const values = []
    let paramIndex = 1

    // Validate status if provided
    if (status) {
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
        return NextResponse.json(
          {
            error: "Invalid status value",
            validValues: "Use one of the defined feedback_status enum values",
          },
          { status: 400, headers: corsHeaders },
        )
      }

      updateQuery += `, status = $${paramIndex}`
      values.push(status)
      paramIndex++
    }

    if (type) {
      updateQuery += `, type = $${paramIndex}`
      values.push(type)
      paramIndex++
    }

    if (title) {
      updateQuery += `, title = $${paramIndex}`
      values.push(title)
      paramIndex++
    }

    if (data) {
      updateQuery += `, data = $${paramIndex}`
      values.push(JSON.stringify(data))
      paramIndex++
    }

    if (notes) {
      updateQuery += `, notes = $${paramIndex}`
      values.push(JSON.stringify(notes))
      paramIndex++
    }

    updateQuery += ` WHERE id = $${paramIndex} RETURNING id, title, modified_at, status`
    values.push(id)

    const result = await executeQuery(updateQuery, values)

    return NextResponse.json(
      {
        success: true,
        id: result.rows[0].id,
        title: result.rows[0].title,
        status: result.rows[0].status,
        modified_at: result.rows[0].modified_at,
        message: "Feedback updated successfully",
      },
      { status: 200, headers: corsHeaders },
    )
  } catch (error) {
    console.error("Failed to update feedback:", error)
    return NextResponse.json(
      {
        error: "Failed to update feedback",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: corsHeaders },
    )
  }
}

/**
 * @swagger
 * /api/support/{id}:
 *   delete:
 *     tags:
 *       - Support & Feedback
 *     summary: Delete a feedback entry
 *     description: Deletes a feedback entry by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Feedback ID
 *     responses:
 *       200:
 *         description: Feedback deleted successfully
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    const { id } = await context.params

    // Check if feedback exists
    const checkQuery = `SELECT id FROM feedback WHERE id = $1`
    const checkResult = await executeQuery(checkQuery, [id])

    if (checkResult.rowCount === 0) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404, headers: corsHeaders })
    }

    // Delete the feedback
    const deleteQuery = `DELETE FROM feedback WHERE id = $1`
    await executeQuery(deleteQuery, [id])

    return NextResponse.json(
      {
        success: true,
        message: "Feedback deleted successfully",
      },
      { status: 200, headers: corsHeaders },
    )
  } catch (error) {
    console.error("Failed to delete feedback:", error)
    return NextResponse.json(
      {
        error: "Failed to delete feedback",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500, headers: corsHeaders },
    )
  }
}
