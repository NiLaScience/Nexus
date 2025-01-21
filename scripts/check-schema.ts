import 'dotenv/config'
import sql from '../lib/db'

async function checkSchema() {
  try {
    console.log('Checking database connection...')
    
    // Test connection with a simple query
    await sql`SELECT 1`
    console.log('Connected successfully!\n')

    // Get all tables in the public schema
    const tables = await sql`
      SELECT table_name, column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, ordinal_position;
    `
    
    console.log('Current Schema:\n')
    let currentTable = ''
    
    tables.forEach((column: any) => {
      if (column.table_name !== currentTable) {
        currentTable = column.table_name
        console.log(`\nTable: ${currentTable}`)
        console.log('------------------------')
      }
      console.log(`${column.column_name}: ${column.data_type} ${column.is_nullable === 'YES' ? '(nullable)' : '(required)'}`)
    })

    // Get all enums
    const enums = await sql`
      SELECT t.typname as enum_name, e.enumlabel as enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      ORDER BY t.typname, e.enumsortorder;
    `

    if (enums.length > 0) {
      console.log('\n\nEnums:')
      console.log('------------------------')
      let currentEnum = ''
      enums.forEach((e: any) => {
        if (e.enum_name !== currentEnum) {
          currentEnum = e.enum_name
          console.log(`\n${currentEnum}: `)
        }
        console.log(`  - ${e.enum_value}`)
      })
    }

  } catch (error) {
    console.error('Error details:', error)
    if (error instanceof Error) {
      console.error('\nTroubleshooting steps:')
      console.error('1. Check if DATABASE_URL is correctly formatted')
      console.error('2. Verify the password is URL-encoded')
      console.error('3. Confirm the database is accessible')
      console.error('4. Check if SSL is required')
    }
  } finally {
    await sql.end()
  }
}

checkSchema() 