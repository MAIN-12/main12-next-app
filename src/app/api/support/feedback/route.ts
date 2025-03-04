/**
 * @swagger
 * /api/support/feedback:
 *   post:
 *     tags:
 *       - Support & Feedback
 *     summary: Submit user feedback with optional file attachments
 *     description: Creates a new feedback entry in Monday.com with user details, feedback type, description, and optional file attachments.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the feedback
 *                 example: "Issue with Dashboard"
 *               user:
 *                 type: string
 *                 description: JSON string containing user information
 *               description:
 *                 type: string
 *                 description: Detailed feedback description
 *                 example: "The dashboard takes too long to load when filtering results."
 *               location:
 *                 type: string
 *                 description: The page or section where the issue was encountered
 *                 example: "Dashboard > Reports"
 *               type:
 *                 type: string
 *                 description: The type of feedback (e.g., bug, suggestion, other)
 *                 example: "bug"
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of files to be uploaded (each file should be 20MB or less)
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
 *                   description: The ID of the created feedback item
 *                   example: "12345"
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
 *         description: Error submitting feedback
 */

import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const apiKey = process.env.MONDAY_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "API key is missing" }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const app_name = formData.get("app_name") as string
    const title = formData.get("title") as string
    const userJson = formData.get("user") as string
    const description = formData.get("description") as string
    const location = formData.get("location") as string
    const type = formData.get("type") as string
    const files = formData.getAll("files") as File[]

    if (!title || !description || !location || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let user = null
    if (userJson) {
      try {
        user = JSON.parse(userJson)
      } catch (error) {
        console.error("Failed to parse user JSON:", error)
      }
    }

    const boardId = process.env.MONDAY_FEEDBACK_BOARD
    const url = "https://api.monday.com/v2"

    const today = new Date().toISOString().split("T")
    const date = today[0]
    const time = today[1].split(".")[0]

  
    const query = `mutation {
      create_item (
        board_id: ${boardId},
        item_name: "${title}",
        column_values: "{
        \\"text_mknqe5aa\\":\\"${app_name}\\",
          \\"email\\": {
            \\"text\\" : \\"${user?.name || ""}\\", 
            \\"email\\" : \\"${user?.email || ""}\\"},
          \\"date_mkm2gphh\\": {
            \\"date\\" : \\"${date}\\", 
            \\"time\\" : \\"${time}\\"},
          \\"text\\":\\"${location}\\",
          \\"type_mkmwdrkv\\":\\"${type}\\",
          \\"long_text\\":\\"${description}\\"
        }"
      ) {id}}`

    const createResponse = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ query }),
    })

    const createResult = await createResponse.json()

    if (createResult.errors) {
      console.error(JSON.stringify(createResult, null, 2))
      return NextResponse.json({ error: "Error submitting feedback to Monday.com" }, { status: 500 })
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
          add_file_to_column (item_id: ${itemId}, column_id: "file_mknqzns0", file: $file) {
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

    return NextResponse.json({ success: true, id: itemId, fileUploads: fileUploadResults })
  } catch (error) {
    console.error("Failed to submit feedback:", error)
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 })
  }
}

