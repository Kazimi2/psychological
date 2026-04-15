const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function keepAlive() {
  try {
    // 执行一个简单的查询，例如查询用户表
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      console.error('Error executing query:', error);
      process.exit(1);
    }

    console.log('Keepalive query executed successfully:', data);
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

keepAlive();