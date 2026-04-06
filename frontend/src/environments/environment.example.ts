// =================================================
// INTEGRABRIDGE - FRONTEND ENVIRONMENT EXAMPLE  
// =================================================
//
// ⚠️  IMPORTANTE: 
// Este é um arquivo de EXEMPLO. 
// Copie este arquivo para environment.ts e environment.prod.ts
// e substitua pelos valores reais.
//

export const environment = {
  production: false,
  
  // API Configuration
  apiUrl: 'http://localhost:3000/api',
  
  // Supabase Configuration
  // Para obter: https://supabase.com > Settings > API
  supabaseUrl: 'https://your-project-id.supabase.co',
  supabaseKey: 'your-anon-public-key-here',
  
  // App Configuration
  appName: 'IntegraBridge',
  version: '1.0.0'
};

// =================================================
// PRODUCTION EXAMPLE (environment.prod.ts)
// =================================================
//
// export const environment = {
//   production: true,
//   apiUrl: 'https://integrabridge-api.onrender.com/api',
//   supabaseUrl: 'https://your-project-id.supabase.co',
//   supabaseKey: 'your-anon-public-key-here',
//   appName: 'IntegraBridge',
//   version: '1.0.0'
// };