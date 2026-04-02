import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '../database.types'

// Client-side Supabase client
export const createClient = () => createClientComponentClient<Database>()
