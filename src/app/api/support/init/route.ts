import { NextResponse } from "next/server"
import { executeQuery } from "@/lib/db"

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
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
 * /api/support/init:
 *   post:
 *     tags:
 *       - Support & Feedback
 *     summary: Initialize the feedback database table
 *     description: Creates the feedback table in Postgres if it doesn't exist
 *     responses:
 *       200:
 *         description: Table initialized successfully
 *       500:
 *         description: Server error
 */
export async function POST() {
    try {
        // Create the feedback table if it doesn't exist
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        app VARCHAR(25) NOT NULL,
        type VARCHAR(25) NOT NULL,
        status VARCHAR(25) NOT NULL DEFAULT 'pending',
        data JSONB NOT NULL,
        notes JSONB DEFAULT '[]'::JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        modified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `

        await executeQuery(createTableQuery)

        // Create an index on the app column for faster lookups
        const createAppIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_feedback_app ON feedback(app);
    `

        await executeQuery(createAppIndexQuery)

        // Create an index on the type column for faster lookups
        const createTypeIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
    `

        await executeQuery(createTypeIndexQuery)

        // Create an index on the status column for faster lookups
        const createStatusIndexQuery = `
      CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
    `

        await executeQuery(createStatusIndexQuery)

        return NextResponse.json({ success: true, message: "Feedback table initialized successfully" }, { status: 200 })
    } catch (error) {
        console.error("Failed to initialize feedback table:", error)
        return NextResponse.json({ error: "Failed to initialize feedback table" }, { status: 500 })
    }
}

