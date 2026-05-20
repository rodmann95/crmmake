import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ndngzqmzforgcjbcuxlb.supabase.co';
const supabaseKey = 'sb_publishable_xxwklRzZueR0GdnahycOMQ_ywJK8fiZ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Querying deals table...');
  const { data: deals, error: dealsErr } = await supabase
    .from('deals')
    .select('id, name, stage, amount, maintenance_amount, commercial_cycle, created_at, won_date');
    
  if (dealsErr) {
    console.error('Error fetching deals:', dealsErr);
  } else {
    console.log('Deals in database count:', deals.length);
    console.log('Won deals count:', deals.filter(d => d.stage === 'won').length);
    console.log('Won deals details:', JSON.stringify(deals.filter(d => d.stage === 'won'), null, 2));
  }
}

main();
