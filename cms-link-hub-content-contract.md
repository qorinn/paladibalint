# Developer Link Hub — CMS integrációs szerződés

Ez a dokumentum a publikus Astro Link Hub és a külön CMS/admin projekt közötti adat- és publikálási szerződés. A CMS szerkeszt és publikál; a Link Hub csak a közzétett tartalmat jeleníti meg statikus oldalként, valamint anonim eseményeket rögzít.

## Működési folyamat

CMS-piszkozat → rekordok publikálása → CMS meghívja a Netlify build hookot → Astro build Supabase-ből olvas → statikus HTML a Netlify CDN-en.

Profil-, szekció-, projekt- és linkváltozás csak az új deploy után látszik. A követett `/go/:slug` redirect ettől függetlenül, futásidőben olvassa az adatbázist.

## Felelősségek

| CMS/admin projekt               | Publikus Link Hub                             |
| ------------------------------- | --------------------------------------------- |
| CRUD, login, jogosultságok      | Csak `published` tartalom build-idős olvasása |
| Piszkozat/publikálás            | Statikus, egyoldalas link hub                 |
| Validáció és Netlify build hook | `/go/:slug` redirect és tracking              |
| Opcionális analytics dashboard  | Anonim page-view endpoint                     |

Nem része a Link Hubnak CMS UI, admin felület, projekt-detail oldal, publikáló gomb, analytics dashboard, chart vagy riport.

## Kötelező Supabase táblák

`site_profile`, `sections`, `projects`, `section_projects`, `links`, `analytics_sessions`, `analytics_events`.

A publikus build az első öt táblát a `public` sémából olvassa. Hiányzó vagy nem olvasható tábla esetén a production build szándékosan hibával leáll, nem gyárt üres oldalt. Mindenhol csak a pontos `status = 'published'` érték látható; a CMS használhat `draft` és `archived` státuszt is.

## Tartalommodell

### `site_profile`

Egyetlen közzétett profilrekord szükséges; a CMS ezt egyetlen site settingként kezelje.

| Mező                | Kötelező | Jelentés                                             |
| ------------------- | -------- | ---------------------------------------------------- |
| `id`                | igen     | Stabil UUID vagy string                              |
| `name`              | igen     | Főcím, pl. `Paládi Bálint`                           |
| `position`          | nem      | Szerepkör                                            |
| `description`       | nem      | Rövid bemutatkozás                                   |
| `avatar_path`       | nem      | Lokális publikus útvonal, pl. `/images/profile.webp` |
| `location`          | nem      | Helyszín                                             |
| `availability_text` | nem      | Rövid elérhetőségi üzenet                            |
| `footer_text`       | nem      | Láblécszöveg                                         |
| `meta_title`        | nem      | HTML és Open Graph cím                               |
| `meta_description`  | nem      | Meta description és Open Graph leírás                |
| `og_image_path`     | nem      | Publikus OG-kép útvonala                             |
| `expand_label`      | nem      | Kibontó címke, pl. `Több`                            |
| `collapse_label`    | nem      | Visszazáró címke, pl. `Kevesebb`                     |
| `status`            | igen     | Csak `published` jelenik meg                         |

Az `avatar_path` és `og_image_path` nem Supabase Storage URL. A fájlnak a Link Hub repository `public/` mappájában kell lennie; a CMS csak az útvonalat tárolja. Hiányzó avatar esetén az oldal monogramos fallbacket mutat.

### `sections`

A CMS által megadott `title` jelenik meg az oldalon; a frontend nem feltételez fix címeket, például „Selected Work” vagy „Open Source”.

| Mező           | Kötelező | Jelentés                                                 |
| -------------- | -------- | -------------------------------------------------------- |
| `id`           | igen     | Stabil azonosító                                         |
| `key`          | igen     | Belső, ajánlottan egyedi kulcs                           |
| `title`        | nem      | Látható szekciócím                                       |
| `description`  | nem      | Rövid szekcióleírás                                      |
| `section_type` | igen     | `primary_links`, `social_links`, `links` vagy `projects` |
| `sort_order`   | igen     | Növekvő sorrendben jelenik meg                           |
| `status`       | igen     | Csak `published` jelenik meg                             |

Ajánlott jelentés: `primary_links` a fő CTA-khoz, `social_links` a közösségi oldalakhoz, `links` egyéb önálló linkekhez, `projects` projektblokkokhoz. A renderer általános: egy szekció a hozzá rendelt közvetlen linkeket és/vagy projekteket mutatja, ha van tartalma.

### `projects`

A projekt nem kap önálló route-ot vagy detail oldalt; csak szekción belüli elem.

| Mező                   | Kötelező | Jelentés                                                            |
| ---------------------- | -------- | ------------------------------------------------------------------- |
| `id`                   | igen     | Stabil azonosító                                                    |
| `title`                | igen     | Projekt neve                                                        |
| `slug`                 | igen     | Stabil, ajánlottan egyedi CMS-kulcs; nem route                      |
| `short_description`    | nem      | Mindig látható rövid leírás                                         |
| `expanded_description` | nem      | Natív kibontóval megjelenő extra leírás                             |
| `image_path`           | nem      | Külső HTTPS logó- vagy kép URL; 64 × 64 projektképként renderelődik |
| `status`               | igen     | Csak `published` projekt jelenik meg                                |

Az `expanded_description` csak nem üres értéknél látszik. A feliratok a profil `expand_label` és `collapse_label` mezőjéből jönnek, fallbackként `More` / `Less` értékkel.

### `section_projects`

Many-to-many kapcsolótábla: egy projekt több szekcióban is szerepelhet, szekciónként eltérő sorrendben.

| Mező         | Kötelező | Jelentés                              |
| ------------ | -------- | ------------------------------------- |
| `section_id` | igen     | FK `sections.id`                      |
| `project_id` | igen     | FK `projects.id`                      |
| `sort_order` | igen     | Projekt sorrendje az adott szekcióban |

Ajánlott adatbázis constraint: `UNIQUE (section_id, project_id)`.

### `links`

Minden kattintható elem itt van: közvetlen szekciólink és projekt alatti link is. A CMS ne hozzon létre külön project-link táblát.

| Mező              | Kötelező              | Jelentés                                        |
| ----------------- | --------------------- | ----------------------------------------------- |
| `id`              | igen                  | Stabil analytics azonosító                      |
| `section_id`      | feltételes            | FK `sections.id`, közvetlen szekciólinkhez      |
| `project_id`      | feltételes            | FK `projects.id`, projektlinkhez                |
| `label`           | igen                  | Látható, önmagában is érthető címke             |
| `description`     | nem                   | A teljes szélességű link alatt megjelenő szöveg |
| `icon`            | nem                   | Előre definiált ikonazonosító                   |
| `target_url`      | igen                  | Valódi cél URL                                  |
| `redirect_slug`   | trackelt linknél igen | Stabil `/go/:slug` kulcs                        |
| `trackable`       | igen                  | Követett redirectet kér-e                       |
| `open_in_new_tab` | igen                  | Új fülön nyíljon-e meg                          |
| `style`           | nem                   | `default`, `primary` vagy `subtle`              |
| `sort_order`      | igen                  | Sorrend a szülőn belül                          |
| `status`          | igen                  | Csak `published` jelenik meg                    |

Egy linknek pontosan egy szülője legyen. Javasolt constraint: `CHECK ((section_id IS NULL) <> (project_id IS NULL))`.

### Linkstílusok és ikonok

| `style`               | Megjelenés                        |
| --------------------- | --------------------------------- |
| `primary`             | Erős, kiemelt CTA                 |
| `default` vagy `NULL` | Alapértelmezett, keretes linkgomb |
| `subtle`              | Visszafogott, halvány háttér      |

Ne tároljon a CMS Tailwind classokat, inline CSS-t vagy HTML-t. A jelenleg leképezett ikonazonosítók: `github`, `linkedin`, `instagram`, `mail`, `file-text`, `globe`, `external-link`, `youtube`. Ismeretlen érték ikon nélkül, hiba nélkül jelenik meg; a CMS inkább a fenti fix választékot kínálja. Az `x` például jelenleg fallbackként ikon nélkül renderelődik.

Projektkártyánál az `image_path` teljes külső HTTPS URL is lehet, például `https://lotuszmasszazs.hu/images/lotus-logo.webp`. A kép 64 × 64 pixeles, lekerekített logóként jelenik meg a projekt neve és leírása mellett.

### Trackelt linkek

`trackable = true` esetén a külső URL nem kerül a HTML `href` mezőjébe, hanem `/go/{redirect_slug}` jelenik meg. A CMS validálja, hogy a trackelt linkhez legyen egyedi, nem üres slug, csak `[A-Za-z0-9_-]` karakterekkel. A slug ne változzon csak azért, mert a `label` módosult. A `target_url` csak `https:`, `http:` vagy `mailto:` URL legyen.

Nem trackelt link közvetlenül a `target_url`-t használja. A hibás `trackable = true` + üres slug kombináció jelenleg közvetlen linkre esik vissza, ezért ezt a CMS-nek kötelező tiltania.

## Publikálási függőségek

- A szekciók, közvetlen linkek és `section_projects` rekordok saját `sort_order ASC` szerint jelennek meg.
- Egy projekt több szekcióban is felhasználható.
- Üres szekció nem jelenik meg.
- Egy közzétett projektlink redirectje akkor működik, ha a projekt `published` és legalább egy közzétett szekcióhoz hozzá van rendelve.
- Egy közzétett közvetlen szekciólink redirectje akkor működik, ha a szülő szekció is `published`.
- Egyébként a `/go/:slug` `404` választ ad. Sikeres esetben `302` redirect és `Cache-Control: no-store` érkezik.

Ajánlott CMS-publikálás: validáció → szülők, gyerekek és kapcsolatok publikálása → Netlify build hook hívása. Visszavonáskor `draft` vagy `archived` státusz, majd új build. A redirect futásidőben ellenőrzi a státuszt, ezért egy visszavont slug már az új statikus deploy előtt is `404` lehet.

## Anonim analitikai szerződés

A session cookie neve `lh_sid`, beállításai: `HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=1800`. A session ID szerveroldali `crypto.randomUUID()`, a böngésző nem olvassa.

Page view kérés:

`POST /api/analytics/page-view` JSON body: `pathname`, `referrer`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`.

A function a referrerből csak origin + pathname értéket tart meg, query stringet nem. UTM mezőket legfeljebb 120, pathname-et 512 karakterre korlátoz. Azonos klienscímenként egy funkciópéldányban 30 kérés/perc könnyű, nem perzisztens limit van.

### `analytics_events` minimális szerződés

| Oszlop                                                                | Page view           | Link click              |
| --------------------------------------------------------------------- | ------------------- | ----------------------- |
| `session_id`                                                          | kötelező            | kötelező                |
| `event_type`                                                          | `page_view`         | `link_click`            |
| `link_id`                                                             | `NULL`              | kötelező, FK `links.id` |
| `pathname`                                                            | küldött pathname    | `NULL`                  |
| `referrer`                                                            | sanitizált referrer | `NULL`                  |
| `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` | opcionális          | `NULL`                  |
| `created_at`                                                          | `now()` default     | `now()` default         |

Az `analytics_sessions` a hosszabb távú modell része, de a jelenlegi Link Hub még nem ír külön session sort; az események `session_id` mezője köti össze a sessiont. Külön session tábla vagy `record_analytics_event` RPC később a `src/lib/server/analytics.ts` modul mögött vezethető be, UI-módosítás nélkül.

Ne gyűjtsetek nevet, e-mail címet, browser fingerprintet vagy nyers IP-címet.

## Környezeti változók

| Környezet             | Változó                    | Cél                         |
| --------------------- | -------------------------- | --------------------------- |
| Astro / Netlify build | `SUPABASE_URL`             | Supabase projekt URL        |
| Astro / Netlify build | `SUPABASE_PUBLISHABLE_KEY` | Közzétett tartalom olvasása |
| Netlify Functions     | `SUPABASE_URL`             | Supabase projekt URL        |
| Netlify Functions     | `SUPABASE_SECRET_KEY`      | Redirect és analytics írás  |

A jelenlegi kód lokálisan elfogadja a `SUPABASE_SERVICE_ROLE_KEY` értéket fallbackként. Élesben buildhez korlátozott publishable kulcs, Functions-höz Netlify-ben tárolt secret szükséges. Secret/service-role kulcs ne kapjon `PUBLIC_` előtagot és ne kerüljön böngészőoldali JavaScriptbe.

A build jelenleg `select=*` lekérést használ. A publikus tartalomtáblákba ne kerüljenek titkok vagy admin belső mezők; ilyen igénynél használjatok külön publikus view-t vagy szűkítsétek az oszloplistát a Link Hubban.

## CMS publikálási checklist

- Pontosan egy publikált profil van, kitöltött `name` értékkel.
- Minden publikált szekciónak van `key`, `section_type` és `sort_order` értéke.
- Minden publikált projektnek van `title` és `slug` értéke.
- A `section_projects` mindkét oldala létezik.
- Minden linknek pontosan egy szülője van.
- Publikált linkhez tartozik `label`, `target_url` és `sort_order`.
- Projekt opcionális `image_path` értéke érvényes HTTPS kép- vagy logó URL.
- Trackelt linkhez érvényes, egyedi `redirect_slug` tartozik.
- Az ikon és stílus csak engedélyezett érték.
- Publikálás után a Netlify build hook meghívódik.
