import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://aeiyvkquvunosizqchtb.supabase.co'
const supabaseAnonKey = 'sb_publishable_-BddkTwRnEmlYOxBgNSbGA_FCv8lZPE'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase
    .from('sortie_medicament')
    .select(`*`)
    .limit(1)
  console.log("sortie_medicament:", error || data)
  
  const res2 = await supabase
    .from('sorties_medicaments')
    .select(`*`)
    .limit(1)
  console.log("sorties_medicaments:", res2.error || res2.data)
  
  const res3 = await supabase
    .from('sorties_medicament')
    .select(`*`)
    .limit(1)
  console.log("sorties_medicament:", res3.error || res3.data)
}
test()
