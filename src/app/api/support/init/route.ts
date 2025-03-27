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
    // Create the feedback status enum type if it doesn't exist
    const createEnumQuery = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'feedback_status') THEN
          CREATE TYPE feedback_status AS ENUM (
            -- Initial states
            'pending',
            'new',
            
            -- Review states
            'inReview',
            'triaged',
            
            -- Action states
            'inProgress',
            'planned',
            'blocked',
            'needsInfo',
            
            -- Resolution states
            'resolved',
            'completed',
            'verified',
            'deployed',
            
            -- Closing states
            'closed',
            'duplicate',
            'wontFix',
            'invalid',
            
            -- Other states
            'migrated',
            'archived',
            'reopened',
            'ok'
          );
        END IF;
      END
      $$;
    `

    await executeQuery(createEnumQuery)

    // Check if the table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'feedback'
      );
    `

    const tableExists = await executeQuery(checkTableQuery)
    
    // If the table exists, check if it has the title column
    if (tableExists.rows[0].exists) {
      const checkTitleColumnQuery = `
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'feedback'
          AND column_name = 'title'
        );
      `
      
      const titleColumnExists = await executeQuery(checkTitleColumnQuery)
      
      // If the title column doesn't exist, add it
      if (!titleColumnExists.rows[0].exists) {
        const addTitleColumnQuery = `
          ALTER TABLE feedback 
          ADD COLUMN title VARCHAR(255);
        `
        
        await executeQuery(addTitleColumnQuery)
        
        // Update existing records to populate the title column from the data JSON
        const updateExistingRecordsQuery = `
          UPDATE feedback 
          SET title = (data->>'title')::VARCHAR(255)
          WHERE title IS NULL;
        `
        
        await executeQuery(updateExistingRecordsQuery)
        
        console.log("Added title column to existing feedback table")
      }
    } else {
      // Create the feedback table with the title column
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS feedback (
          id VARCHAR(50) PRIMARY KEY,
          app VARCHAR(25) NOT NULL,
          type VARCHAR(25) NOT NULL,
          title VARCHAR(255) NOT NULL,
          status feedback_status NOT NULL DEFAULT 'pending',
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
      
      // Create an index on the title column for faster lookups and searches
      const createTitleIndexQuery = `
        CREATE INDEX IF NOT EXISTS idx_feedback_title ON feedback(title);
      `

      await executeQuery(createTitleIndexQuery)
      
      console.log("Created new feedback table with title column")
    }

    // After creating the table and indexes, add:
    const checkTableQuery2 = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'feedback'
      );
    `

    const checkResult = await executeQuery(checkTableQuery2)
    console.log("Table exists check:", checkResult.rows[0])

    // Also check the table structure
    const tableStructureQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'feedback';
    `

    const structureResult = await executeQuery(tableStructureQuery)
    console.log("Table structure:", structureResult.rows)

    return NextResponse.json({ success: true, message: "Feedback table initialized successfully" }, { status: 200 })
  } catch (error) {
    console.error("Failed to initialize feedback table:", error)
    return NextResponse.json(
      {
        error: "Failed to initialize feedback table",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
