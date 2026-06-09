# SimLab Brand Assets Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate three custom SVG vector assets for SimLab branding (logo, favicon, and notebook icon) in the `/home/yuan/my_project/logo/` directory.

**Architecture:** Create three individual, standard-compliant, and beautifully designed SVG files featuring the violet-coral-orange gradient theme. The design features a cold-to-warm interlocking double-loop "S" structure representing simulation & computation.

**Tech Stack:** SVG (Scalable Vector Graphics), XML.

---

### Task 1: Create Logo Output Directory

**Files:**
- Create: `/home/yuan/my_project/logo/` (if it does not exist)

- [ ] **Step 1: Check and create the target folder**
  Run: `mkdir -p /home/yuan/my_project/logo`
  Expected: Success, directory created.

- [ ] **Step 2: Commit**
  ```bash
  git add logo/ || true
  git commit -m "chore: ensure logo output directory exists" --allow-empty
  ```

---

### Task 2: Create Main Logo (`simlab-logo.svg`)

**Files:**
- Create: `/home/yuan/my_project/logo/simlab-logo.svg`

- [ ] **Step 1: Write the main logo SVG content**
  Create `/home/yuan/my_project/logo/simlab-logo.svg` with the following content:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
    <defs>
      <!-- Cold-Warm Balance Gradient -->
      <linearGradient id="simlab-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8A2387;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#E94057;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#F27121;stop-opacity:1" />
      </linearGradient>
      <!-- Glow Drop Shadow Filter -->
      <filter id="simlab-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#E94057" flood-opacity="0.25"/>
      </filter>
    </defs>
    <!-- Background rounded card -->
    <rect width="100" height="100" rx="24" fill="#111118" />
    
    <!-- Abstract S-shaped Interlocking Curves (Physics & Solvers) -->
    <g filter="url(#simlab-shadow)">
      <!-- Left cool loop -->
      <path d="M 50,15 
               C 32,15 22,27 22,42 
               C 22,58 35,63 50,68 
               C 65,73 78,78 78,92 
               C 78,96 75,100 70,100 
               L 50,100 
               C 62,90 70,82 70,72 
               C 70,60 58,55 45,50 
               C 30,45 28,38 28,30 
               C 28,22 36,15 50,15 Z" 
            fill="url(#simlab-grad)" />
      
      <!-- Right warm loop -->
      <path d="M 50,85 
               C 68,85 78,73 78,58 
               C 78,42 65,37 50,32 
               C 35,27 22,22 22,8 
               C 22,4 25,0 30,0 
               L 50,0 
               C 38,10 30,18 30,28 
               C 30,40 42,45 55,50 
               C 70,55 72,62 72,70 
               C 72,78 64,85 50,85 Z" 
            fill="url(#simlab-grad)" opacity="0.85" />
    </g>
    
    <!-- Lab Grid Accents representing Calculation mesh -->
    <circle cx="50" cy="50" r="3" fill="#FFFFFF" opacity="0.9" />
    <circle cx="35" cy="30" r="2" fill="#FFFFFF" opacity="0.5" />
    <circle cx="65" cy="70" r="2" fill="#FFFFFF" opacity="0.5" />
  </svg>
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add logo/simlab-logo.svg
  git commit -m "feat: add SimLab main logo SVG"
  ```

---

### Task 3: Create Favicon (`simlab-favicon.svg`)

**Files:**
- Create: `/home/yuan/my_project/logo/simlab-favicon.svg`

- [ ] **Step 1: Write the favicon SVG content**
  Create `/home/yuan/my_project/logo/simlab-favicon.svg` with the following content:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%">
    <defs>
      <!-- Cold-Warm Balance Gradient -->
      <linearGradient id="favicon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8A2387;stop-opacity:1" />
        <stop offset="50%" style="stop-color:#E94057;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#F27121;stop-opacity:1" />
      </linearGradient>
    </defs>
    <!-- Background Circle for tab visibility -->
    <circle cx="16" cy="16" r="16" fill="#111118" />
    
    <!-- Simplified Interlocking "S" Logo -->
    <path d="M 16,5 
             C 11,5 8,9 8,13 
             C 8,18 12,19 16,21 
             C 20,23 24,24 24,28 
             C 24,29 23,30 22,30 
             L 16,30 
             C 20,27 22,25 22,22 
             C 22,18 18,17 14,15 
             C 10,13 10,11 10,9 
             C 10,7 12,5 16,5 Z" 
          fill="url(#favicon-grad)" />
          
    <path d="M 16,27 
             C 21,27 24,23 24,19 
             C 24,14 20,13 16,11 
             C 12,9 8,8 8,4 
             C 8,3 9,2 10,2 
             L 16,2 
             C 12,5 10,7 10,10 
             C 10,14 14,15 18,17 
             C 22,19 22,21 22,23 
             C 22,25 20,27 16,27 Z" 
          fill="url(#favicon-grad)" opacity="0.8" />
  </svg>
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add logo/simlab-favicon.svg
  git commit -m "feat: add SimLab favicon SVG"
  ```

---

### Task 4: Create Custom Notebook Icon (`simlab-notebook.svg`)

**Files:**
- Create: `/home/yuan/my_project/logo/simlab-notebook.svg`

- [ ] **Step 1: Write the notebook SVG content**
  Create `/home/yuan/my_project/logo/simlab-notebook.svg` with the following content:
  ```xml
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22" width="100%" height="100%">
    <defs>
      <linearGradient id="nb-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8A2387;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#F27121;stop-opacity:1" />
      </linearGradient>
    </defs>
    <!-- Notebook main page card with SimLab Gradient border -->
    <rect x="2" y="2" width="18" height="18" rx="3" fill="none" stroke="url(#nb-grad)" stroke-width="1.5" />
    
    <!-- Left spine divider representing binders -->
    <line x1="6" y1="2" x2="6" y2="20" stroke="url(#nb-grad)" stroke-width="1" stroke-dasharray="2 1" />
    
    <!-- Mini interlocking S wave curve in the center -->
    <path d="M 13,6 
             C 10,6 9,8 9,10 
             C 9,13 11,13 13,14 
             C 15,15 16,16 16,18 
             C 16,19 14,20 13,20 
             C 15,18 15,17 15,16 
             C 15,14 13,13 11,12 
             C 9,11 9,10 9,9 
             C 9,7 10,6 13,6 Z" 
          fill="url(#nb-grad)" />
    <path d="M 13,16 
             C 16,16 17,14 17,12 
             C 17,9 15,9 13,8 
             C 11,7 9,6 9,4 
             C 9,3 10,2 13,2 
             C 11,4 11,5 11,6 
             C 11,8 13,9 15,10 
             C 17,11 17,12 17,13 
             C 17,14 16,16 13,16 Z" 
          fill="url(#nb-grad)" opacity="0.8" />
  </svg>
  ```

- [ ] **Step 2: Commit**
  ```bash
  git add logo/simlab-notebook.svg
  git commit -m "feat: add SimLab notebook icon SVG"
  ```
