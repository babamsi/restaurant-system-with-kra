# Supabase Database Setup Guide

## Overview

This guide will help you set up the Supabase database for the Cafeteria Management System. The database includes comprehensive tables for suppliers, inventory, kitchen management, recipes, batches, and system logging.

## Prerequisites

1. **Supabase Account**: Create an account at [supabase.com](https://supabase.com)
2. **Node.js**: Ensure you have Node.js installed (version 16 or higher)
3. **Supabase CLI** (optional): Install for local development

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `cafeteria-management`
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
5. Click "Create new project"
6. Wait for the project to be created (usually takes 2-3 minutes)

## Step 2: Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)

## Step 3: Configure Environment Variables

1. Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

2. Add `.env.local` to your `.gitignore` file:

```gitignore
# Environment variables
.env.local
.env.development.local
.env.test.local
.env.production.local
```

## Step 4: Install Dependencies

Install the required Supabase packages:

```bash
npm install @supabase/supabase-js
npm install @supabase/auth-helpers-nextjs
npm install @supabase/auth-helpers-react
```

## Step 5: Run Database Schema

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy the entire content from `database/supabase-schema.sql`
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

This will create:
- ✅ All database tables
- ✅ Indexes for performance
- ✅ Triggers for automatic timestamps
- ✅ Sample data (categories, units, suppliers)
- ✅ Row Level Security (RLS) policies
- ✅ Database comments for documentation

## Step 6: Verify Database Setup

After running the schema, verify that all tables were created:

1. Go to **Table Editor** in your Supabase dashboard
2. You should see the following tables:
   - `suppliers`
   - `categories`
   - `units`
   - `ingredients`
   - `purchase_orders`
   - `purchase_order_items`
   - `kitchen_storage`
   - `recipes`
   - `recipe_ingredients`
   - `batches`
   - `batch_ingredients`
   - `system_logs`

## Step 7: Test Database Connection

Create a simple test to verify the connection:

```typescript
// test-connection.ts
import { supabase } from '@/lib/supabase'

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Connection failed:', error)
    } else {
      console.log('Connection successful!', data)
    }
  } catch (error) {
    console.error('Test failed:', error)
  }
}

testConnection()
```

## Step 8: Database Relationships

The database schema includes the following key relationships:

### Suppliers → Ingredients
- One supplier can provide many ingredients
- `ingredients.supplier_id` references `suppliers.id`

### Categories → Ingredients
- One category can contain many ingredients
- `ingredients.category_id` references `categories.id`

### Units → Ingredients/Recipes/Batches
- Units are used across multiple tables
- Ensures consistency in measurements

### Recipes → Recipe Ingredients → Ingredients
- One recipe can have many ingredients
- `recipe_ingredients.recipe_id` references `recipes.id`
- `recipe_ingredients.ingredient_id` references `ingredients.id`

### Batches → Batch Ingredients → Ingredients
- One batch can use many ingredients
- `batch_ingredients.batch_id` references `batches.id`
- `batch_ingredients.ingredient_id` references `ingredients.id`

### Batch Dependencies
- Batches can use other batches as ingredients
- `batch_ingredients.source_batch_id` references `batches.id`

## Step 9: Row Level Security (RLS)

The database includes basic RLS policies that allow all operations. For production, you should:

1. **Set up Authentication**: Configure Supabase Auth
2. **Update RLS Policies**: Create user-specific policies
3. **Test Security**: Verify that users can only access their data

Example RLS policy for authenticated users:

```sql
-- Example: Allow users to only see their own data
CREATE POLICY "Users can only access their own data" ON ingredients
FOR ALL USING (auth.uid() = created_by);
```

## Step 10: Database Functions and Triggers

The schema includes several helpful functions and triggers:

### Automatic Timestamps
- All tables with `updated_at` automatically update when records are modified
- Uses the `update_updated_at_column()` function

### UUID Generation
- All primary keys use UUIDs for better security
- Generated automatically using `uuid_generate_v4()`

## Step 11: Sample Data

The schema includes sample data for:

### Categories
- Proteins, Vegetables, Grains, Dairy, Spices, Oils & Fats, Beverages, Snacks

### Units
- Weight: Grams, Kilograms, Pounds, Ounces
- Volume: Milliliters, Liters
- Custom: Cups, Tablespoons, Teaspoons, Pinch
- Count: Pieces

### Suppliers
- Fresh Foods Ltd
- Quality Meats
- Spice World

## Step 12: Performance Optimization

The database includes several performance optimizations:

### Indexes
- Created on frequently queried columns
- Optimized for common filter operations
- Composite indexes for complex queries

### Query Optimization
- Use `SELECT` with specific columns instead of `*`
- Implement pagination for large datasets
- Use appropriate WHERE clauses

## Step 13: Backup and Recovery

### Enable Point-in-Time Recovery
1. Go to **Settings** → **Database**
2. Enable "Point-in-Time Recovery"
3. Set retention period (recommended: 7 days)

### Regular Backups
1. Go to **Settings** → **Database**
2. Click "Create backup"
3. Download the backup file
4. Store securely

## Step 14: Monitoring

### Database Monitoring
1. Go to **Dashboard** → **Database**
2. Monitor:
   - Query performance
   - Connection usage
   - Storage usage
   - Error rates

### Logs
- System logs are stored in the `system_logs` table
- Monitor for errors and unusual activity
- Set up alerts for critical issues

## Step 15: Production Considerations

### Environment Variables
- Use different keys for development and production
- Never commit sensitive keys to version control
- Use environment-specific configuration

### Security
- Enable SSL connections
- Use strong passwords
- Regularly rotate API keys
- Monitor access logs

### Performance
- Use connection pooling
- Implement caching where appropriate
- Monitor query performance
- Optimize indexes based on usage patterns

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify environment variables
   - Check project URL and API key
   - Ensure project is active

2. **Permission Denied**
   - Check RLS policies
   - Verify user authentication
   - Review table permissions

3. **Schema Errors**
   - Check SQL syntax
   - Verify table dependencies
   - Review constraint violations

### Getting Help

- **Supabase Documentation**: [docs.supabase.com](https://docs.supabase.com)
- **Community Forum**: [github.com/supabase/supabase/discussions](https://github.com/supabase/supabase/discussions)
- **Discord**: [discord.supabase.com](https://discord.supabase.com)

## Next Steps

After setting up the database:

1. **Update Application Code**: Replace local storage with Supabase calls
2. **Implement Authentication**: Set up user management
3. **Add Real-time Features**: Use Supabase real-time subscriptions
4. **Deploy**: Deploy your application with the new database
5. **Monitor**: Set up monitoring and alerting

## Database Schema Overview

```
suppliers
├── ingredients (many)
└── purchase_orders (many)

categories
└── ingredients (many)

units
├── ingredients (many)
├── recipes (many)
├── batches (many)
└── kitchen_storage (many)

ingredients
├── recipe_ingredients (many)
├── batch_ingredients (many)
└── kitchen_storage (one)

recipes
├── recipe_ingredients (many)
└── batches (many)

batches
├── batch_ingredients (many)
└── source_batches (many, via batch_ingredients)

purchase_orders
└── purchase_order_items (many)

system_logs (standalone)
```

This comprehensive setup provides a solid foundation for your cafeteria management system with proper relationships, security, and performance optimizations. 