# Auth-Architektur & Provider-Wechsel (Local → Supabase)

Diese Datei dokumentiert **verbindlich**, wie die Authentifizierung in der Lernplattform aufgebaut ist und wie der spätere Wechsel von der lokalen MVP-Auth zu Supabase Auth erfolgt – **ohne Refactor der App-Logik**.

---

## 🎯 Ziel dieser Architektur

* MVP: **lokale Auth** (localStorage + Cookie)
* Produktion: **Supabase Auth**
* **Kein Umbau** von UI, Gates oder Business-Logik beim Wechsel
* Auth ist **austauschbare Infrastruktur**, kein Feature

---

## 🧠 Grundprinzip

Die App kennt **keinen Auth-Anbieter direkt**.

Alle Zugriffe laufen über einen **Auth-Adapter**:

```
lib/auth/provider.ts
```

UI, Server-Komponenten und Gates sprechen **ausschließlich** mit diesem Adapter.

---

## 🔌 Aktuelle Provider

### 1️⃣ Local Auth Provider (aktiv – MVP)

**Datei:**

```
lib/auth/providers/local.ts
```

**Eigenschaften:**

* localStorage (`lp.auth.v1`)
* Cookie (`lp_auth_v1`)
* Kein Backend
* Stabil für MVP & Entwicklung

**Warum:**

* Schnell
* Debug-freundlich
* Kein Infrastruktur-Overhead

---

### 2️⃣ Supabase Auth Provider (vorbereitet – inaktiv)

**Datei:**

```
lib/auth/providers/supabase.ts
```

**Status:**

* ⚠️ **Stub / Platzhalter**
* Noch **keine** Supabase-Abhängigkeit
* Keine SDK-Imports

**Warum noch nicht implementiert:**

* Kein Supabase-Projekt
* Keine Keys
* Kein Mehrwert im aktuellen MVP-Stadium

---

## 🧩 Gemeinsames Interface (verbindlich)

Alle Auth-Provider **müssen** dieses Interface implementieren:

```ts
interface AuthProvider {
  id: "local" | "supabase";

  getSession(ctx?: SessionContext): Promise<AuthResult<AuthSession | null>>;
  getUser(ctx?: SessionContext): Promise<AuthResult<AppUser | null>>;

  signIn(input: SignInInput): Promise<AuthResult<AuthSession>>;
  signUp(input: SignUpInput): Promise<AuthResult<AuthSession>>;
  signOut(): Promise<AuthResult<null>>;
}
```

➡️ **Keine Abweichungen erlaubt.**

---

## 🔁 Umschalten des Providers

Der aktive Provider wird **zentral** bestimmt.

**Datei:**

```
lib/auth/provider.ts
```

Beispiel:

```ts
const ACTIVE_PROVIDER = "local"; // später: "supabase"
```

oder via Environment:

```env
NEXT_PUBLIC_AUTH_PROVIDER=local
# später
NEXT_PUBLIC_AUTH_PROVIDER=supabase
```

➡️ **Ein einziger Schalter**.

---

## 🚦 Was beim Wechsel NICHT geändert werden darf

❌ Keine Anpassung in:

* DashboardGate
* ProfessionGate
* Header / Navigation
* Login / Signup UI
* Onboarding
* Business-Logik

Diese Teile sprechen **nur mit dem Adapter**.

---

## ✅ Checkliste: Wann Supabase aktiviert werden sollte

Supabase-Auth sollte **erst dann** implementiert werden, wenn mindestens eines zutrifft:

* echte Nutzerkonten erforderlich
* Gerätewechsel unterstützen
* Progress serverseitig speichern
* Pro-Features / Bezahlung
* DSGVO-konforme Persistenz

---

## 🔜 Vorgehen beim späteren Wechsel

1. Supabase-Account anlegen
2. Projekt erstellen
3. Auth aktivieren (E-Mail / Passwort)
4. Environment Variablen setzen
5. `supabaseAuthProvider` implementieren
6. `NEXT_PUBLIC_AUTH_PROVIDER=supabase`
7. Fertig.

➡️ **Kein Refactor der App notwendig.**

---

## 🏁 Fazit

Diese Architektur stellt sicher, dass:

* Auth kein Risiko für die Produktentwicklung ist
* Infrastruktur später austauschbar bleibt
* das MVP nicht über-engineered wird

**Local jetzt, Supabase später – ohne Schmerzen.**


Erledigt ✅
Ich habe eine **Dokudatei zum Auth-Wechsel (Local → Supabase)** angelegt und sauber strukturiert.

### 📄 Datei

**`AUTH_SWITCH.md`**

### Inhalt (kurz zusammengefasst)

* 🎯 Ziel & Motivation der Architektur
* 🧠 Grundprinzip: **Auth als austauschbare Infrastruktur**
* 🔌 Aktuelle Provider:

  * `localAuthProvider` (aktiv, MVP)
  * `supabaseAuthProvider` (Stub, vorbereitet)
* 🧩 Verbindliches `AuthProvider`-Interface
* 🔁 Wie der Provider zentral umgeschaltet wird
* 🚫 Was beim Wechsel **nicht** angefasst werden darf
* ✅ Checkliste: *Wann* Supabase sinnvoll ist
* 🔜 Klare Schritt-für-Schritt-Anleitung für den späteren Wechsel
* 🏁 Fazit für zukünftige Entwickler (oder dich in 6 Monaten)

👉 Die Datei ist bewusst so geschrieben, dass:

* **du selbst** später sofort weißt, was zu tun ist
* **ein anderer Entwickler** ohne Rückfragen den Wechsel durchführen kann
* **keine Architektur-Diskussion** neu geführt werden muss

---

Wenn du willst, können wir als nächsten Mini
