// Supabase Configuration - SIMPLIFIED VERSION
// This version is more reliable and handles initialization properly

const SUPABASE_URL = 'https://uizmaltiwtdqjxxyfqtp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpem1hbHRpd3RkcWp4eHlmcXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NDYyODQsImV4cCI6MjA4NjIyMjI4NH0.VjGY7I76ZKK3NoOVIr8FbnHu6OsuxkD9Z_gzBv3MV2I';

// Global variables (using var to avoid redeclaration issues)
var supabase;
var currentUser = null;

// Initialize Supabase when library is loaded
(function initializeSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.log('⏳ Waiting for Supabase library to load...');
        setTimeout(initializeSupabase, 100);
        return;
    }

    try {
        // Create Supabase client
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase client initialized successfully');

        // Set up authentication state listener
        supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔐 Auth state changed:', event);

            if (session && session.user) {
                currentUser = session.user;
                console.log('👤 User logged in:', currentUser.email);

                // Call handleAuthSuccess if it exists
                if (typeof handleAuthSuccess === 'function') {
                    handleAuthSuccess(currentUser);
                }
            } else {
                currentUser = null;
                console.log('👋 User logged out');

                // Call handleLogout if it exists
                if (typeof handleLogout === 'function') {
                    handleLogout();
                }
            }
        });

        // Check for existing session
        checkExistingSession();

    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
    }
})();

// Check if user is already logged in
async function checkExistingSession() {
    if (!supabase) {
        console.warn('⚠️ Supabase not initialized yet');
        return;
    }

    try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
            console.error('❌ Error checking session:', error);
            return;
        }

        if (session && session.user) {
            currentUser = session.user;
            console.log('✅ Existing session found:', currentUser.email);

            if (typeof handleAuthSuccess === 'function') {
                handleAuthSuccess(currentUser);
            }
        } else {
            console.log('ℹ️ No existing session');
        }
    } catch (error) {
        console.error('❌ Session check failed:', error);
    }
}
