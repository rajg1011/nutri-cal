import { createClient } from '@supabase/supabase-js'

const anonKey = import.meta.env.VITE_ANON_KEY
const projectURL = import.meta.env.VITE_PROJECT_URL

const supabase = createClient(projectURL, anonKey, {
  auth: {
    flowType: 'pkce',
  }
})

export default supabase