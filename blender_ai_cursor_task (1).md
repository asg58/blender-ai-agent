# 🧠 Blender AI Expert Agent – Cursor Task Script

## 🎯 Doel
Bouw een AI-agent die in realtime Blender begrijpt en aanstuurt op basis van:
- Live scene data (via WebSocket)
- Blender API kennis (semantisch zoeken)
- Gebruikersinput via spraak of tekst

---

## 📦 Modules

### 1. `/backend/knowledge_kernel/scrape_api_docs.py`
**Beschrijving**: Download alle pagina’s uit de officiële Blender Python API Docs  
- URL: `https://docs.blender.org/api/current/bpy.ops.html`
- Gebruik `requests` + `BeautifulSoup`
- Parse `<div role="main">`
- Verzamel `title`, `content`, `url`
- Output: `blender_api_scraped.json`

---

### 2. `/backend/knowledge_kernel/embed_index.py`
**Beschrijving**: Embed de API-teksten als vectoren  
- Model: `all-MiniLM-L6-v2` (via SentenceTransformers)
- Opslaan in `api_index/`
- Gebruik `chromadb` als backend
- Collection: `blender_api`

---

### 3. `/backend/knowledge_kernel/search.py`
**Beschrijving**: Zoek op semantische basis binnen de Blender API-index  
- Functie: `search_blender_api(query: str, n=3)`  
- Return: top `n` document(en) met `content` + `url`

---

### 4. `/backend/services/ai_agent.py`
**Beschrijving**: AI-agent genereert Blender-code op basis van prompt  
- Zoek met `search_blender_api()`  
- Combineer top 2 resultaten tot contextblok  
- Bouw prompt zoals:

```text
[KENNIS]:
<API uitleg 1>
<API uitleg 2>

[OPDRACHT]:
<gebruikersprompt>

[UITVOERBARE CODE]:
```

- Verstuur naar: `http://localhost:11434/api/chat`

---

### 5. `/blender_agent/websocket_server.py`
**Beschrijving**: WebSocket-agent in Blender  
- Voeg `"introspect_scene"` toe: geeft JSON van objecten, materialen, nodes  
- Voeg `"describe_function"` toe: geeft `bpy.ops.*.__doc__` terug  
- Verstuur JSON naar client

---

## ✅ Resultaat
- Volledig geïntegreerde AI-agent die:
  - De scene begrijpt
  - Blender API slim toepast
  - Zelf relevante functies zoekt en gebruikt

---

## ✨ Bonusopties
- Uploadmodule: `.svg`, `.dxf` → automatisch importeren & extruderen
- Live 3D render feedback
- Realtime correctie bij foutmeldingen

---

> Klaar voor productie met `Cursor`, `Chroma`, `FastAPI`, `Ollama`, en `Blender`.
