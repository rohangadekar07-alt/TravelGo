---
description: Push project to new GitHub repository (TravelGo-v2)
---

This workflow will push your current project to the new v2 repository on GitHub.

1. Stage all changes
```powershell
git add .
```

2. Create a professional commit
```powershell
git commit -m "Updated TravelGO project with new features"
```

3. Add the new remote repository
```powershell
git remote add v2 https://github.com/rohangadekar07-alt/TravelGo-v2.git
```

4. Ensure you are on the main branch
```powershell
git branch -M main
```

5. Push to the new repository
```powershell
git push -u v2 main
```
