# 🧠 Blender AI Expert Agent

Een realtime AI-assistent voor Blender die:
- Spraakcommando's omzet naar `bpy` Python-code
- Vectorbestanden zoals SVG, DXF en EPS verwerkt tot 3D-modellen
- Realtime met Blender communiceert via WebSocket
- Volledig begrijpt wat er in de Blender-scene gebeurt
- De Blender Python API semantisch begrijpt via een eigen kennis-index (ChromaDB)

---

## 🚀 Functionaliteit

- 🎙️ Spraakherkenning (Whisper.cpp)
- 🧠 Stemherkenning (Resemblyzer)
- 🔁 Sessiebeheer per gebruiker
- 📡 WebSocket-agent in Blender (voert scripts live uit)
- 🔍 Scene introspectie (objecten, materialen, nodes)
- 📘 Blender API scraping + vector search (Chroma)
- 📄 SVG/DXF/Vector-import en 3D-extrusie
- 🧾 Realtime codegeneratie via Mixtral 8x7B of GPT
- 🖼️ Frontend: Mic + Render Viewer

---

## 📁 Projectstructuur

```
/frontend              ← Next.js spraakinterface + viewer
/backend
  /routes              ← generate, whisper, upload
  /services            ← ai_agent, blender_ws, whisper_local
  /knowledge_kernel    ← scrape, embed, search Blender API
/blender_agent         ← WebSocket-server in Blender
```

---

## 🛠️ Installatie (kort overzicht)

1. Installeer [Ollama](https://ollama.com) met Mixtral of GPT
2. Start backend met FastAPI
3. Run frontend (`npm run dev`)
4. Start Blender met WebSocket-agent
5. Optioneel: scrape en embed Blender API (`python scrape_api_docs.py`, `embed_index.py`)

---

## 📌 Status

✅ MVP functioneel  
🧠 AI redeneert met Blender-kennis  
📡 Blender voert commando's realtime uit  
🔁 Uitbreidbaar naar animatie, rendering, nodes en physics

---

## 🤖 Gebouwd met

- FastAPI
- ChromaDB
- SentenceTransformers
- Whisper.cpp
- Resemblyzer
- Blender 3.x+
- Next.js
- Mixtral 8x7B (of GPT)

---

> Dit project wordt stap voor stap opgebouwd door AI en gebruiker samen.
> Laatste update: 2025-04-11
