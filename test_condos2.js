import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testCondos() {
    console.log("Fetching condos without joining profile:");
    const { data: condos, error: condosError } = await supabase
        .from('condos')
        .select(`*`)
        .order('created_at', { ascending: false });
    
    console.log("Condos error:", condosError);
    console.log("Condos data length:", condos?.length);
    console.log("First condo manager_id:", condos?.[0]?.manager_id);
}

testCondos();
