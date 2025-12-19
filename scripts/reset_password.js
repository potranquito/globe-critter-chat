
import { createClient } from '@supabase/supabase-js';
import path from 'path';

const supabaseUrl = 'https://iwmbvpdqwekgxegaxrhr.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3bWJ2cGRxd2VrZ3hlZ2F4cmhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTkwNTgxMSwiZXhwIjoyMDc1NDgxODExfQ.9p0xTvFhBOZiZjd9HKpoDFJP3rcOyWRaINqGeWppldM';


if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetPassword(email) {
  console.log(`Attempting to reset password for: ${email}`);
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.error('User not found!');
    return;
  }

  console.log(`Found user ${user.id}. Updating password...`);

  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: 'Iloveanimals1234!!@' }
  );

  if (error) {
    console.error('Error updating password:', error);
  } else {
    console.log('Password updated successfully!');
    console.log('New Password: Iloveanimals1234!!@');
  }
}

resetPassword('potranquito@gmail.com');
