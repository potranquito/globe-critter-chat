# 🚀 Quick Start Guide

## ✅ Current Status

**Frontend**: 100% Complete and Working
- Species filter with 4 categories (All, Animals, Birds, Plants/Corals)
- Compact layout (filter + carousel = ~300px)
- Ecological roles showing on all species cards
- Bird call player component ready

**Backend**: Ready to Deploy
- Database migrations created
- Edge function created
- Setup script created

---

## 🎯 What You Need To Do

### Option 1: Quick Test (Frontend Only)
The app is already working! Just test it:

```bash
# Already running at http://localhost:8080
# 1. Click on a region
# 2. Use the vertical filter (left side)
# 3. See ecological roles on species cards
```

**Note**: Bird calls won't work until backend is deployed.

---

### Option 2: Full Deployment (Backend + Bird Calls)

```bash
# 1. Apply database migrations
./setup_complete_backend.sh

# 2. Deploy edge function
supabase functions deploy fetch-bird-call

# 3. Test bird calls!
```

---

## 📋 Backend Deployment Checklist

### Prerequisites
- [ ] PostgreSQL client installed (`psql --version`)
- [ ] Supabase CLI installed (`supabase --version`)
- [ ] `SUPABASE_DB_URL` in `.env` file
- [ ] Supabase account logged in (`supabase login`)

### Steps

**1. Run Setup Script**
```bash
./setup_complete_backend.sh
```
This will:
- Apply species classification migration (adds 3 columns)
- Apply bird calls migration (creates bird_calls table)
- Show statistics on classification results

**2. Deploy Edge Function**
```bash
# Link project (first time only)
supabase link --project-ref YOUR_PROJECT_REF

# Deploy
supabase functions deploy fetch-bird-call
```

**3. Test**
- Restart dev server if needed
- Navigate to a bird species
- Look for 🔊 speaker icon
- Click to play bird call!

---

## 🐛 Quick Troubleshooting

### "SUPABASE_DB_URL not found"
Add to `.env`:
```
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@[PROJECT].supabase.co:5432/postgres
```

### "psql: command not found"
Install PostgreSQL:
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from postgresql.org
```

### "supabase: command not found"
Install Supabase CLI:
```bash
npm install -g supabase
```

### Bird calls not working
1. Check edge function deployed: `supabase functions list`
2. Check browser console for errors
3. First load takes 3-5 seconds (fetching from Xeno-Canto)
4. Subsequent loads are instant (cached)

---

## 📁 Important Files

### Run These:
- `./setup_complete_backend.sh` - Apply database migrations
- `supabase functions deploy fetch-bird-call` - Deploy edge function

### Read These:
- `IMPLEMENTATION_COMPLETE.md` - Full technical documentation
- This file - Quick start guide

### Don't Touch These (unless you know what you're doing):
- `supabase/migrations/*.sql` - Database migrations
- `supabase/functions/fetch-bird-call/index.ts` - Edge function
- `src/utils/speciesClassification.ts` - Classification logic

---

## ✨ Features Overview

### Species Filter (Already Working)
- 🌍 All - Shows everything
- 🦁 Animals - Mammals, fish, reptiles, amphibians, invertebrates
- 🐦 Birds - All bird species
- 🌿 Plants/🪸 Corals - Plants and corals (auto-detects marine)

### Ecological Roles (Already Working)
- 🦁 Predator - Hunters and carnivores
- 🌿 Herbivore - Plant eaters
- 🍽️ Omnivore - Eats both plants and animals
- 🦐 Filter-feeder - Baleen whales, manta rays
- 🌱 Producer - Plants and algae
- 🌊 Mixotroph - Corals (photosynthesis + feeding)
- 🦴 Scavenger - Vultures, hyenas
- ♻️ Detritivore - Decomposers
- 🦠 Parasite - Parasitic species

### Bird Calls (Needs Backend)
- 🔊 Speaker icon on bird cards
- Click to play/pause
- High quality recordings from Xeno-Canto
- Shows recordist, quality, length
- Cached for instant playback

---

## 🎮 Try These Species

### Birds with Great Calls:
- Northern Cardinal (*Cardinalis cardinalis*)
- American Robin (*Turdus migratorius*)
- Blue Jay (*Cyanocitta cristata*)
- Common Loon (*Gavia immer*)
- Bald Eagle (*Haliaeetus leucocephalus*)

### Animals with Interesting Roles:
- Polar Bear - 🦁 Predator
- Green Sea Turtle - 🌿 Herbivore
- Grizzly Bear - 🍽️ Omnivore
- Manta Ray - 🦐 Filter-feeder
- Kelp - 🌱 Producer
- Hard Corals - 🌊 Mixotroph

---

## ⏱️ Time Estimates

- **Frontend testing**: 2 minutes (already working)
- **Backend setup**: 5 minutes (run script + deploy)
- **First bird call fetch**: 3-5 seconds (API call)
- **Cached bird calls**: Instant!

---

## 📞 Need Help?

1. Check `IMPLEMENTATION_COMPLETE.md` for detailed docs
2. Review setup script output for errors
3. Check browser console for frontend issues
4. Check `supabase functions logs` for backend issues

---

**Status**: Frontend 100% complete. Backend ready to deploy.

**Next Step**: Run `./setup_complete_backend.sh` to get bird calls working!

🐦 Happy bird watching! 🎵
