const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually to set environment variables
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const matched = line.match(/^\s*([\w\.\-]+)\s*=\s*(.*)?\s*$/);
    if (matched) {
      const key = matched[1];
      let value = matched[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.replace(/^"|"\s*$/g, '');
      }
      process.env[key] = value.trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing Supabase URL or Service Role Key in .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log("==================================================");
  console.log("🚀 ONBOARDING SANDBOX TEST: GOLDENBIRD TRAVEL AGENCY");
  console.log("==================================================\n");

  try {
    // 1. CLEAN UP PREVIOUS TEST RUNS (to make the test completely idempotent)
    console.log("🧹 Step 1: Cleaning up any old GoldenBird test data...");
    
    // Find previous agency if any
    const { data: oldAgency } = await supabase
      .from('agencies')
      .select('id')
      .eq('subdomain', 'goldenbird')
      .maybeSingle();

    if (oldAgency) {
      console.log(`Found old GoldenBird agency (${oldAgency.id}). Deleting...`);
      
      // Cascaded deletion removes profiles, travel_packages, and websites, but auth.users must be deleted via Admin API
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('agency_id', oldAgency.id);

      if (profiles && profiles.length > 0) {
        for (const p of profiles) {
          console.log(`Deleting auth user: ${p.id}`);
          await supabase.auth.admin.deleteUser(p.id);
        }
      }

      await supabase.from('agencies').delete().eq('id', oldAgency.id);
      console.log("✅ Old agency deleted successfully.");
    } else {
      // Also check emails individually to prevent user creation conflicts
      const { data: users } = await supabase.auth.admin.listUsers();
      if (users && users.users) {
        const testEmails = ['owner@goldenbird.dz', 'employee@goldenbird.dz'];
        for (const u of users.users) {
          if (testEmails.includes(u.email)) {
            console.log(`Deleting stray auth user: ${u.email} (${u.id})`);
            await supabase.auth.admin.deleteUser(u.id);
          }
        }
      }
      console.log("✅ Cleanup complete. Ready for clean onboarding.");
    }

    // 2. CREATE NEW AGENCY
    console.log("\n🏢 Step 2: Creating 'GoldenBird Travel' agency...");
    const theme_config = {
      primary_color: "#F59E0B",   // Golden Amber
      secondary_color: "#1E3A8A", // Deep Navy Blue
      font_family: "Outfit"
    };

    const website_settings = {
      logo_url: "https://api.goldenbird.dz/assets/logo.png",
      cover_image_url: "https://api.goldenbird.dz/assets/cover.jpg",
      phone: "+21331908070",
      email: "booking@goldenbird.dz",
      address: "88 Boulevard des Martyrs, Constantine",
      social_links: {
        facebook: "facebook.com/goldenbirdtravel",
        instagram: "instagram.com/goldenbirdtravel"
      }
    };

    const { data: agency, error: agencyErr } = await supabase
      .from('agencies')
      .insert({
        name: "GoldenBird Travel Agency",
        company_name: "GoldenBird Voyages E.U.R.L",
        subdomain: "goldenbird",
        status: "active",
        business_type_slug: "travel_agency",
        phone: "+21331908070",
        email: "booking@goldenbird.dz",
        address: "88 Boulevard des Martyrs, Constantine",
        city: "Constantine",
        logo_url: "https://api.goldenbird.dz/assets/logo.png",
        cover_image_url: "https://api.goldenbird.dz/assets/cover.jpg",
        theme_config,
        social_links: website_settings.social_links,
        chatbot_enabled: true,
        plan: "pro",
        ai_credits: 1000
      })
      .select()
      .single();

    if (agencyErr || !agency) {
      throw new Error(`Failed to create GoldenBird agency: ${agencyErr?.message}`);
    }
    console.log(`✅ Created Agency: '${agency.name}' with ID: ${agency.id}`);

    // Create travel_agency_config
    const { error: configErr } = await supabase
      .from('travel_agency_config')
      .insert({
        agency_id: agency.id,
        packages_enabled: true,
        custom_trips_enabled: true,
        visa_service_enabled: true,
        insurance_enabled: true,
        group_bookings_enabled: true,
        ai_personality: {
          bot_name: "GoldenBird AI Agent",
          greeting: "Bonjour! Prêt pour un voyage inoubliable avec GoldenBird?",
          tone: "warm_expert",
          languages: ["fr", "ar", "en"]
        }
      });
    
    if (configErr) console.warn("⚠️ Warning: Could not seed travel_agency_config:", configErr.message);

    // 3. CREATE OWNER / SUPERADMIN USER
    console.log("\n👑 Step 3: Creating Owner Account (owner@goldenbird.dz)...");
    const { data: ownerAuth, error: ownerAuthErr } = await supabase.auth.admin.createUser({
      email: "owner@goldenbird.dz",
      password: "secretpassword",
      email_confirm: true,
      user_metadata: { full_name: "GoldenBird Owner" }
    });

    if (ownerAuthErr || !ownerAuth.user) {
      throw new Error(`Failed to create owner auth: ${ownerAuthErr?.message}`);
    }

    const { error: ownerProfileErr } = await supabase
      .from('profiles')
      .insert({
        id: ownerAuth.user.id,
        agency_id: agency.id,
        full_name: "GoldenBird Owner",
        role: "superadmin",
        is_platform_owner: false,
        phone: "+213550998877"
      });

    if (ownerProfileErr) {
      throw new Error(`Failed to create owner profile: ${ownerProfileErr.message}`);
    }
    console.log(`✅ Owner User successfully created & linked! ID: ${ownerAuth.user.id}`);

    // 4. CREATE EMPLOYEE USER
    console.log("\n🧑‍💼 Step 4: Adding Employee Account (employee@goldenbird.dz)...");
    const { data: employeeAuth, error: employeeAuthErr } = await supabase.auth.admin.createUser({
      email: "employee@goldenbird.dz",
      password: "secretpassword",
      email_confirm: true,
      user_metadata: { full_name: "Amine GoldenBird" }
    });

    if (employeeAuthErr || !employeeAuth.user) {
      throw new Error(`Failed to create employee auth: ${employeeAuthErr?.message}`);
    }

    const { error: employeeProfileErr } = await supabase
      .from('profiles')
      .insert({
        id: employeeAuth.user.id,
        agency_id: agency.id,
        full_name: "Amine GoldenBird",
        role: "employee",
        is_platform_owner: false,
        phone: "+213770112233"
      });

    if (employeeProfileErr) {
      throw new Error(`Failed to create employee profile: ${employeeProfileErr.message}`);
    }
    console.log(`✅ Employee User successfully created & linked! ID: ${employeeAuth.user.id}`);

    // 5. SEED TRIPS / TRAVEL PACKAGES
    console.log("\n✈️ Step 5: Seeding cinematic Algerian Travel Packages...");
    
    const packages = [
      {
        agency_id: agency.id,
        title: "Sahara Golden Dunes Expedition",
        subtitle: "A stunning journey to Djanet oasis & Tassili n'Ajjer",
        destination_country: "Algeria",
        destination_city: "Djanet",
        duration_days: 7,
        max_travelers: 15,
        min_travelers: 4,
        base_price_per_person: 95000.00,
        child_price: 60000.00,
        infant_price: 15000.00,
        price_includes: ["All 4x4 desert transfers", "Tuareg guide & camp cook", "Bivouac luxury camping gear", "All meals & traditional mint tea", "Entrance fees to Tassili National Park"],
        price_excludes: ["Flights to Djanet", "Personal travel insurance", "Gratuities & souvenirs"],
        itinerary: [
          { day: 1, title: "Welcome to Djanet", description: "Arrival at Djanet airport, meet-and-greet with local Tuareg guides, transfer to campground." },
          { day: 2, title: "Tikobaouine Stone Arches", description: "Explore the giant natural sandstone arches and ancient rock art sites." },
          { day: 3, title: "Essendilene Canyon hike", description: "Hike deep into the palm-filled canyon to find the hidden natural emerald pool (guelta)." },
          { day: 4, title: "The Weeping Cow Rock Art", description: "Visit the famous neolithic masterpiece carving 'La Vache qui Pleure' at Terarart." }
        ],
        available_dates: [{ departure: "2026-10-15", price: 95000.00 }, { departure: "2026-11-20", price: 95000.00 }],
        tags: ["Desert", "Adventure", "Hiking", "Tuareg Culture"],
        images: ["https://api.goldenbird.dz/packages/desert1.jpg", "https://api.goldenbird.dz/packages/desert2.jpg"],
        status: "active"
      },
      {
        agency_id: agency.id,
        title: "Cinematic Bejaia Coastal Getaway",
        subtitle: "Hike Gouraya National Park & swim at Cap Carbon",
        destination_country: "Algeria",
        destination_city: "Bejaia",
        duration_days: 4,
        max_travelers: 20,
        min_travelers: 5,
        base_price_per_person: 48000.00,
        child_price: 30000.00,
        infant_price: 5000.00,
        price_includes: ["Premium hotel stay (half-board)", "Comfort bus travel from Constantine", "Guided hike up Yemma Gouraya peak", "Private boat ride around Cap Carbon lighthouse"],
        price_excludes: ["Lunches", "Optional aquatic sports"],
        itinerary: [
          { day: 1, title: "Constantine to Bejaia Route", description: "Scenically cross the mountains, check in at the waterfront hotel, dinner overlooking the harbor." },
          { day: 2, title: "Yemma Gouraya Peak Hike", description: "Ascend to the ancient Spanish fort at the top of Gouraya Park, enjoying panoramic Mediterranean views." },
          { day: 3, title: "Cap Carbon Boat Tour & Swimming", description: "Cruise through the sea arches at Cap Carbon and swim in the crystal-clear waters of Les Aiguades." }
        ],
        available_dates: [{ departure: "2026-07-01", price: 48000.00 }, { departure: "2026-08-12", price: 52000.00 }],
        tags: ["Beach", "Nature", "Hiking", "Historical Sites"],
        images: ["https://api.goldenbird.dz/packages/bejaia1.jpg"],
        status: "active"
      }
    ];

    const { data: seededPackages, error: pkgErr } = await supabase
      .from('travel_packages')
      .insert(packages)
      .select();

    if (pkgErr) {
      throw new Error(`Failed to seed travel packages: ${pkgErr.message}`);
    }
    console.log(`✅ Successfully seeded ${seededPackages.length} travel packages!`);
    seededPackages.forEach(p => console.log(`   - [${p.destination_city}] ${p.title} (${p.duration_days} Days) — DZD ${p.base_price_per_person}`));

    // Also seed into legacy `trips` table for public site catalog display
    const trips = [
      {
        agency_id: agency.id,
        title: "Sahara Golden Dunes Expedition",
        description: "A stunning journey to Djanet oasis & Tassili n'Ajjer. Explore giant natural sandstone arches, neolithic masterpieces, and deep palm-filled canyons with local Tuareg guides.",
        price: 95000,
        destination: "Djanet, Algeria",
        duration_days: 7,
        image_urls: ["https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&q=80&w=800"], // Real high-quality sand dune image
        is_active: true,
        show_on_website: true,
        show_on_chatbot: true
      },
      {
        agency_id: agency.id,
        title: "Cinematic Bejaia Coastal Getaway",
        description: "Hike Gouraya National Park & swim at Cap Carbon. Ascend Yemma Gouraya peak for breathtaking Mediterranean views and swim in crystal-clear natural waters.",
        price: 48000,
        destination: "Bejaia, Algeria",
        duration_days: 4,
        image_urls: ["https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&q=80&w=800"], // Real beautiful coastline image
        is_active: true,
        show_on_website: true,
        show_on_chatbot: true
      }
    ];

    const { data: seededTrips, error: tripsErr } = await supabase
      .from('trips')
      .insert(trips)
      .select();

    if (tripsErr) {
      throw new Error(`Failed to seed legacy trips catalog: ${tripsErr.message}`);
    }
    console.log(`✅ Successfully seeded ${seededTrips.length} legacy catalog trips!`);

    // 6. BUILD TRAVEL WEBSITE CONFIG
    console.log("\n🌐 Step 6: Setting up the public GoldenBird Whitelabel Website...");
    
    // Find active template ID
    const { data: template } = await supabase
      .from('travel_agency_templates')
      .select('id')
      .eq('slug', 'escape-premium')
      .single();

    if (template) {
      const { data: website, error: webErr } = await supabase
        .from('travel_agency_websites')
        .insert({
          agency_id: agency.id,
          template_id: template.id,
          config: {
            hero: {
              title: "Discover Algeria's Golden Horizons",
              subtitle: "Curated cinematic journeys from Sahara sands to Mediterranean coastlines.",
              button_text: "Explore Packages"
            },
            colors: {
              primary: "#F59E0B",
              secondary: "#1E3A8A"
            }
          },
          is_published: true,
          subdomain: "goldenbird"
        })
        .select()
        .single();

      if (webErr) {
        throw new Error(`Failed to create public website config: ${webErr.message}`);
      }
      console.log(`✅ Public Whitelabel website registered at: http://goldenbird.localhost:3000/`);
    } else {
      console.warn("⚠️ Escape-Premium template not found in database. Skipping website creation.");
    }

    console.log("\n==================================================");
    console.log("🎉 SANDBOX ONBOARDING COMPLETED SUCCESSFULLY! 🎉");
    console.log("==================================================");
    console.log("GoldenBird Travel is now live on the platform!");
    console.log("Use the following credentials to login and explore:");
    console.log("👉 Owner Dashboard Login:  owner@goldenbird.dz");
    console.log("👉 Employee Dashboard Login: employee@goldenbird.dz");
    console.log("👉 Unified Password:        secretpassword");
    console.log("👉 Custom Subdomain:        http://goldenbird.localhost:3000/");
    console.log("==================================================");

  } catch (err) {
    console.error("\n❌ Sandbox Onboarding failed:", err.message);
  }
}

main();
