import { sql } from "@vercel/postgres"

export async function executeQuery(query: string, values: any[] = []) {
    try {
        const result = await sql.query(query, values)
        return result
    } catch (error) {
        console.error("Database error:", error)
        throw error
    }
}

