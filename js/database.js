// js/database.js

const SUPABASE_URL = "https://oemmqlkwtjxkkputrtsj.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbW1xbGt3dGp4a2twdXRydHNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MjM0MjcsImV4cCI6MjEwNTM5OTQyN30.TeoVCHnRVXcEFAo0vr8rJ5j3O9x2730qyvToLDQ-Bko";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);