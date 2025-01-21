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

Note to self: Stop trying random type combinations when stuck! Instead:
1. Check working examples in codebase
2. Look for patterns in auth/core pages
3. Read error messages carefully - they often tell you exactly what's wrong
