# Development Workflow

## Testing & Deployment Process

### ⚠️ IMPORTANT: Test Before Push

**ALWAYS test changes locally before pushing to GitHub.**

### Workflow Steps:

1. **Make Code Changes**
   - Edit files as needed
   - Save changes

2. **Test Locally** ✅
   - Local dev server should be running: `npm run dev`
   - Open http://localhost:8080/ in browser
   - Test all functionality that was changed
   - Check browser console for errors
   - Verify UX/UI looks correct

3. **User Approval** ✅
   - User tests and confirms changes work
   - User explicitly says "push to GitHub" or similar

4. **Commit & Push**
   - Only after user approval
   - `git add -A`
   - `git commit -m "description"`
   - `git push`

## Common Testing Checklist

### Animal Search Flow:
- [ ] Search for species (e.g., "polar bear")
- [ ] Animal card appears on **right side**
- [ ] Chat input appears **below animal card**
- [ ] Click species in region carousel (left side)
- [ ] Toggle to 2D map view

### Habitat/Location Search Flow:
- [ ] Search for location (e.g., "Las Vegas")
- [ ] Habitat card appears on **right side**
- [ ] Chat input appears **below habitat card**
- [ ] Habitat species list appears on **left side** (vertical scroll)
- [ ] Click on species in habitat list
- [ ] Toggle to 2D map view (should center on habitat)

### Map Controls:
- [ ] Toggle between 3D globe and 2D satellite view
- [ ] Map centers on location when toggling
- [ ] Green dots clickable on map
- [ ] Location services work

### Edge Functions:
- [ ] habitat-discovery responds (Las Vegas → Mojave Desert)
- [ ] species-chat works
- [ ] No CORS errors in console

## Local Development Server

**Start server:**
```bash
npm run dev
```

**Server runs at:**
- Local: http://localhost:8080/
- Network: http://192.168.1.197:8080/

**Stop server:**
- Press `Ctrl+C` in terminal

## Supabase CLI Commands

**Deploy single function:**
```bash
supabase functions deploy <function-name>
```

**View function logs:**
```bash
supabase functions logs <function-name> --tail
```

**List all functions:**
```bash
supabase functions list
```

## Git Commands

**Check status:**
```bash
git status
```

**Stage all changes:**
```bash
git add -A
```

**Commit changes:**
```bash
git commit -m "description"
```

**Push to GitHub:**
```bash
git push
```

## Notes

- Dev server auto-reloads on file changes
- Always check browser console for errors
- Test on actual screen size/resolution
- Verify all API calls succeed (check Network tab)
