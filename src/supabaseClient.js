import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aeiyvkquvunosizqchtb.supabase.co'
const supabaseAnonKey = 'sb_publishable_-BddkTwRnEmlYOxBgNSbGA_FCv8lZPE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
