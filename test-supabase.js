import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://aeiyvkquvunosizqchtb.supabase.co'
const supabaseAnonKey = 'sb_publishable_-BddkTwRnEmlYOxBgNSbGA_FCv8lZPE'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase
    .from('sorties')
    .select(`*, patients:patient_id ( Nom, Prenom )`)
    .limit(1)
  console.log("With alias:", error || data)

  const res2 = await supabase
    .from('sorties')
    .select(`*, patients ( nom, prenom )`)
    .limit(1)
  console.log("Without alias:", res2.error || res2.data)

  const res3 = await supabase
    .from('sorties')
    .select(`*, patients:patient_id ( nom, prenom )`)
    .limit(1)
  console.log("With alias and lowercase:", res3.error || res3.data)
}
test()
