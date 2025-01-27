#!/bin/bash

# Deploy the edge function
supabase functions deploy rag-retrieval --no-verify-jwt

# Set environment variables
supabase secrets set OPENAI_API_KEY=$OPENAI_API_KEY 