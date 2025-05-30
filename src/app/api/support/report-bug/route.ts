import { NextResponse } from "next/server"

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin") || ""

  // Allow all origins
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400", // 24 hours
    },
  })
}

/**
 * @swagger
 * /api/support/report-bug:
 *   post:
 *     tags:
 *       - Support & Feedback
 *     summary: Submit a bug report with optional file attachments
 *     description: Creates a bug report item in Monday.com and uploads any attached files
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the bug report
 *               description:
 *                 type: string
 *                 description: Detailed description of the bug
 *               location:
 *                 type: string
 *                 description: The location or URL where the bug occurred
 *               user:
 *                 type: string
 *                 description: JSON string containing user information
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of files to be uploaded (each file should be 20MB or less)
 *     responses:
 *       200:
 *         description: Bug report submitted successfully
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
 *                   description: The ID of the created bug report item in Monday.com
 *                 fileUploads:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Name of the uploaded file
 *                       success:
 *                         type: boolean
 *                         description: Whether the file upload was successful
 *                       id:
 *                         type: string
 *                         description: ID of the uploaded file (if successful)
 *                       error:
 *                         type: string
 *                         description: Error message (if upload failed)
 *       400:
 *         description: Bad request - missing required fields
 *       500:
 *         description: Server error
 */

export async function POST(request: Request) {
  const origin = request.headers.get("origin") || ""

  console.log("bug report init")
  // Create response headers based on origin validation
  const corsHeaders = getCorsHeaders(origin)

  // Always use CORS headers since we're allowing all origins

  const apiKey = process.env.MONDAY_API_KEY
  if (!apiKey) {
    console.error("API key is missing")
    return NextResponse.json({ error: "API key is missing" }, { status: 500, headers: corsHeaders })
  }

  try {
    const formData = await request.formData()
    const app_name = formData.get("app_name") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const location = formData.get("location") as string
    const userJson = formData.get("user") as string
    const files = formData.getAll("files") as File[]

    console.log("app_name", app_name)
    console.log("title", title)
    console.log("description", description)
    console.log("location", location)

    if (!title || !description || !location) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400, headers: corsHeaders })
    }

    let user = null
    if (userJson) {
      try {
        user = JSON.parse(userJson)
      } catch (error) {
        console.error("Failed to parse user JSON:", error)
      }
    }

    const boardId = process.env.MONDAY_BUG_BOARD
    const url = "https://api.monday.com/v2"

    const today = new Date().toISOString().split("T")
    const date = today[0]
    const time = today[1].split(".")[0]

    const createItemQuery = `mutation {
      create_item (
        board_id: ${boardId},
        item_name: "${title}",
        column_values: "{
          \\"text_mknqg0dz\\":\\"${app_name}\\",
          \\"bug_status\\":\\"Awaiting Review\\",
          \\"status_18\\":\\"Alpha\\",
          \\"external_user_mkm2s584\\": {
            \\"text\\" : \\"${user?.name || ""}\\\", 
            \\"email\\" : \\"${user?.email || ""}\\"},
          \\"date9\\": {
            \\"date\\" : \\"${date}\\", 
            \\"time\\" : \\"${time}\\"},
          \\"text_mkm1cmpq\\":\\"${location}\\",
          \\"long_text\\":\\"${description}\\"
        }") {
          id
        }
      }`

    const createResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ query: createItemQuery }),
    })

    const createResult = await createResponse.json()

    if (createResult.errors) {
      console.error(JSON.stringify(createResult, null, 2))
      return NextResponse.json(
        { error: "Error creating bug report in Monday.com" },
        { status: 500, headers: corsHeaders },
      )
    }

    const itemId = createResult.data.create_item.id

    // Upload files if any
    const fileUploadResults = []
    if (files.length > 0) {
      for (const file of files) {
        const fileUploadFormData = new FormData()
        fileUploadFormData.append(
          "query",
          `mutation($file: File!) {
          add_file_to_column (item_id: ${itemId}, column_id: "files", file: $file) {
            id
          }
        }`,
        )
        fileUploadFormData.append("variables[file]", file)

        const fileUploadResponse = await fetch("https://api.monday.com/v2/file", {
          method: "POST",
          headers: {
            Authorization: apiKey,
          },
          body: fileUploadFormData,
        })

        if (!fileUploadResponse.ok) {
          console.error(`Failed to upload file ${file.name}:`, fileUploadResponse.statusText)
          fileUploadResults.push({ name: file.name, success: false, error: fileUploadResponse.statusText })
        } else {
          const fileUploadResult = await fileUploadResponse.json()
          if (fileUploadResult.errors) {
            console.error(`Error uploading file ${file.name}:`, fileUploadResult.errors)
            fileUploadResults.push({ name: file.name, success: false, error: fileUploadResult.errors[0].message })
          } else {
            fileUploadResults.push({ name: file.name, success: true, id: fileUploadResult.data.add_file_to_column.id })
          }
        }
      }
    }

    return NextResponse.json(
      { success: true, id: itemId, fileUploads: fileUploadResults },
      { status: 200, headers: corsHeaders },
    )
  } catch (error) {
    console.error("Failed to submit bug report:", error)
    return NextResponse.json({ error: "Failed to submit bug report" }, { status: 500, headers: corsHeaders })
  }
}

/**
 * Helper function to get CORS headers based on origin
 */
function getCorsHeaders(origin: string): Record<string, string> {
  // Allow all origins
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
}

