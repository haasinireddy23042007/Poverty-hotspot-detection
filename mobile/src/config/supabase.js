import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Move these to a .env file and use a library like react-native-dotenv to load them.
// The values are currently mirrored in mobile/.env (which is gitignored).
import { SUPABASE_URL, SUPABASE_KEY } from './secrets';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
