// Único punto de entrada del SDK que utiliza el área docente.
 // El empaquetado se hace en CI y se sirve desde GitHub Pages, sin CDNs.
import {createClient} from '@supabase/supabase-js';
window.supabase={createClient};
