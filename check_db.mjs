import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ndngzqmzforgcjbcuxlb.supabase.co';
const supabaseKey = 'sb_publishable_xxwklRzZueR0GdnahycOMQ_ywJK8fiZ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Querying contacts table...');
  const { data: contacts, error: contactsErr } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, company_id, company_ids');
    
  if (contactsErr) {
    console.error('Error fetching contacts:', contactsErr);
  } else {
    console.log('Contacts in database count:', contacts.length);
    console.log('Contacts:', contacts);
  }

  console.log('\nQuerying contact_companies table...');
  const { data: cc, error: ccErr } = await supabase
    .from('contact_companies')
    .select('*');
    
  if (ccErr) {
    console.error('Error fetching contact_companies:', ccErr);
  } else {
    console.log('Contact Companies count:', cc.length);
    console.log('Contact Companies:', cc);
  }
}

main();
