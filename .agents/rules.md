# Development Rules & Standards

1. **Asset First:** Nessun componente viene sviluppato senza aver prima ottimizzato il peso dei media.
2. **Mobile Strategy:** Video 9:16 separati per mobile; non usare crop via CSS per risparmiare banda.
3. **Canvas over Image:** Per sequenze superiori a 50 frame, usare sempre <canvas> invece di cambiare il `src` di un tag <img>.
4. **Performance:** Ogni frame della Sezione 2 non deve superare i 120KB.
5. **Branding:** Solo Bianco (#FFFFFF) e Nero (#000000). Sfumature concesse solo tramite opacità o "light points".