/**
 * @swagger
 * /api/support/upload-file:
 *   post:
 *     tags:
 *       - Support & Feedback
 *     summary: Upload a file attachment for a bug report
 *     description: Uploads a file and attaches it to an existing bug report item in Monday.com
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               itemId:
 *                 type: string
 *                 description: The ID of the bug report item in Monday.com
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to be uploaded (supports jpg, png, pdf, svg)
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *       400:
 *         description: Bad request - missing itemId or file
 *       500:
 *         description: Server error
 */

import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const apiKey = process.env.MONDAY_API_KEY
  if (!apiKey) {
    console.error("API key is missing")
    return NextResponse.json({ error: "API key is missing" }, { status: 500 })
  }

  try {
    const formData = await request.formData()
    const itemId = formData.get("itemId") as string
    const file = formData.get("file") as File | null

    if (!itemId || !file) {
      console.error("Missing itemId or file", { itemId, file })
      return NextResponse.json({ error: "Item ID and file are required" }, { status: 400 })
    }

    console.log("Received file:", file.name, "Size:", file.size, "Type:", file.type)

    // Check file size (limit to 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 20MB limit" }, { status: 400 })
    }

    const url = "https://api.monday.com/v2/file"

    const mondayFormData = new FormData()
    mondayFormData.append(
      "query",
      `mutation($file: File!) {
      add_file_to_column (item_id: ${itemId}, column_id: "files", file: $file) {
        id
      }
    }`,
    )
    mondayFormData.append("variables[file]", file)

    console.log("Sending request to Monday.com")
    console.log("Query:", mondayFormData.get("query"))
    console.log("File name:", file.name)

    const fileUploadResponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: apiKey,
      },
      body: mondayFormData,
    })

    if (!fileUploadResponse.ok) {
      console.error("Monday.com API response not OK:", fileUploadResponse.status, fileUploadResponse.statusText)
      const responseText = await fileUploadResponse.text()
      console.error("Response body:", responseText)
      return NextResponse.json(
        { error: `Monday.com API error: ${fileUploadResponse.statusText}` },
        { status: fileUploadResponse.status },
      )
    }

    const fileUploadResult = await fileUploadResponse.json()

    if (fileUploadResult.errors) {
      console.error("File upload error:", JSON.stringify(fileUploadResult.errors, null, 2))
      return NextResponse.json({ error: fileUploadResult.errors[0].message }, { status: 500 })
    }

    console.log("File uploaded successfully")
    return NextResponse.json({ success: true, id: fileUploadResult.data.add_file_to_column.id })
  } catch (error) {
    console.error("Failed to upload file:", error)
    return NextResponse.json(
      { error: `Failed to upload file: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    )
  }
}

