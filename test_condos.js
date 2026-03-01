import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testCondos() {
    console.log("Fetching condos with profiles join...");
    const { data: condos, error: condosError } = await supabase
        .from('condos')
        .select(`*, manager:profiles(id, full_name, role)`)
        .order('created_at', { ascending: false });
    
    console.log("Condos error:", condosError);
    console.log("Condos data length:", condos?.length);
    
    const { data: managers, error: managersError } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'ADMIN');
        
    console.log("Managers error:", managersError);
    console.log("Managers data length:", managers?.length);
}

testCondos();
