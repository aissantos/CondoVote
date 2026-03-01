import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testQuery() {
    console.log("Teste 1: Consultando Condos como Anônimo");
    const { data: condos, error: condosError } = await supabase.from('condos').select('*');
    console.log("Condos (Anon):", condos?.length || 0, "Erro:", condosError);

    console.log("Teste 2: Consultando Profiles como Anônimo");
    const { data: profs, error: profError } = await supabase.from('profiles').select('id, role').limit(5);
    console.log("Profiles (Anon):", profs?.length || 0, "Erro:", profError);
}
testQuery();
