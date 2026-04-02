import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '../database.types'

// Server-side Supabase client
export const createServerClient = () =>
  createServerComponentClient<Database>({ cookies })
