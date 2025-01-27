# Agent Notes

## Next.js App Router Gotchas

### Dynamic Route Types
HOLY MOLY the Next.js App Router types are tricky! After wasting time with 5+ different approaches, here's what I learned:

1. DON'T try to use `PageProps` or other Next.js types directly - they're internal and change between versions
2. DON'T copy patterns from older Next.js pages - App Router is completely different
3. DO look at working examples in the codebase (auth pages were super helpful)
4. DO handle params as Promises in dynamic routes (e.g. `params: Promise<{ id: string }>`)

### Deployment Setup
For AWS Amplify deployment:
1. Need both `amplify.yml` and proper `next.config.ts`
2. Use `output: 'standalone'` in Next.js config for better build optimization
3. Configure proper image domains if using Next.js Image component
4. Cache node_modules AND .next/cache in Amplify for faster builds

### Supabase Cookie Store in Next.js 14+
The cookie store API changed in Next.js 14+:
1. `cookies()` now returns a Promise, so need to await it
2. `set()` and `delete()` now take a single options object instead of separate arguments
3. Example:
   ```ts
   const cookieStore = await cookies();
   cookieStore.set({ name, value, ...options });
   cookieStore.delete({ name, ...options });
   ```

## RAG Implementation Learnings

### Vector Database Setup
1. Use pgvector with OpenAI's text-embedding-3-large (3072 dimensions)
2. Create proper indexes for vector similarity search
3. Always include workspace_id for multi-tenancy
4. Use queue system for async embedding generation

### Content Processing
1. Combine relevant fields for better context:
   - Tickets: title + description
   - Messages: message content
   - Articles: title + content
   - Templates: template content

### Edge Functions
1. Process queue in batches to manage rate limits
2. Use proper error handling and retries
3. Store metadata about embedding process
4. Run on 5-minute intervals for balance

Note to self: Stop trying random type combinations when stuck! Instead:
1. Check working examples in codebase
2. Look for patterns in auth/core pages
3. Read error messages carefully - they often tell you exactly what's wrong

## Critical Incident Report - 2025-01-27 🚨

### Incident: Dangerous Database Reset Suggestion
During RAG implementation, the agent suggested running `supabase db reset` to fix a migration issue. This was an extremely dangerous suggestion that could have:
- Wiped all production data
- Caused significant financial damage
- Disrupted customer operations
- Lost valuable business information

### Root Cause Analysis 🔍
1. Agent failed to:
   - Consider the environment context
   - Follow the principle of least destructive action
   - Properly respect production data
   - Use appropriate migration tools

### Corrective Actions ✅
1. **NEVER** suggest `db reset` without:
   - Explicit environment verification
   - Clear warnings about data loss
   - User confirmation
   - Backup procedures

2. **ALWAYS** use `migration up` for schema changes:
   ```bash
   supabase migration up  # Safe way to apply new migrations
   ```

### Learning Outcomes 📝
1. Treat every database as if it's production
2. Use migrations for schema changes
3. Never suggest destructive operations without clear warnings
4. Document dangerous commands to avoid
