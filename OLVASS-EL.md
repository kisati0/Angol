# Szómondó 1 – javított v72

Készült: 2026. szeptember 10.

Ez az eredeti alkalmazás javított, teljes másolata. Az eredeti asztali mappa fájljai változatlanok. A csomag nincs feltöltve tárhelyre.

## Használat és frissítés

1. Csomagold ki a ZIP-et. A `Szomondo-javitott` mappában találod az alkalmazást.
2. Ha már webcímről használod, a mappa **teljes tartalmát** másold az alkalmazás jelenlegi helyére. Az `index.html`, `sw.js`, `manifest.json` és ikonok mellett az új **`core.js` fájl és a teljes `vendor` mappa is szükséges**. Tartsd meg a könyvtárszerkezetet.
3. A korábbi böngészőadatok eléréséhez ugyanabban a böngészőben, ugyanazon a webcímen nyisd meg. Másik cím vagy böngésző külön adattárat használ. Frissítés előtt érdemes a fontos szavakat és mondatokat a meglévő CSV-exporttal kimenteni; ez nem teljes alkalmazásmentés.
4. Zárd be az alkalmazás többi megnyitott ablakát, majd nyisd meg újra. Ha megjelenik a **Frissítés** gomb, nyomd meg. Ha még a régi felület látszik, zárd be az összes ablakát és indítsd újra. A böngésző webhelyadatait ne töröld, mert ott vannak a mentett profilok és könyvek.
5. Az első betöltéshez legyen internetkapcsolat. A telepíthető és offline működéshez HTTPS-tárhely vagy helyi `localhost` kiszolgálás kell. Az `index.html` dupla kattintásos megnyitása nem ad teljes PWA-működést.

Az új változatban a főoldal tetején látszik az aktív profil és a fordítás iránya. A profil nevével megnyithatod a profilválasztót. Az iránygombbal az automatikus, magyar → idegen és idegen → magyar mód között válthatsz. Rövid, nem egyértelmű szónál válassz irányt.

## Elkészült javítások

- **Gyakorlás:** az Ellenőrzés, Következő szó és Bezárás gomb kattintásra működik; a gombnyomást nem nyeli el a lapozási gesztus.
- **Profilok:** az új profil üresen indul. Profilváltáskor a régi eredménykártya, kijelölés és folyamatban lévő fordítás törlődik; a függő szerkesztés a megfelelő profilba mentődik. A régi `en` mezőjű szótár átalakításakor helyi biztonsági másolat készül.
- **CSV:** megmaradnak a többsoros mondatok, idézőjelek és a sorok közötti kapcsolatok. Hibás idézőjelezéskor az import nem írja felül az adatokat. A mondatcsomag újbóli importja nem duplázza ugyanazt a csomagot.
- **Fordítás:** a későn visszaérkező válasz nem írja felül az új kijelölést. Kézzel választható a fordítás iránya. A hálózati kérések időkorlátot és megszakítást kaptak; a MyMemory hibaválasza nem kerül be fordításként.
- **E-könyvek:** egyetlen importkezelő és egységes könyvadatbázis működik. A két korábbi adatbázisformátum tartalmát az alkalmazás átviszi az új változatba. A könyvtár listázásakor nem tölti be minden könyv teljes tartalmát.
- **Olvasás és mentés:** a szókijelölés megőrzi az EPUB kiemeléseit, hivatkozásait és képeit. A mentés az adott kijelölés fordítását használja. A könyvjelzők megmaradnak, a lecserélt olvasópéldány felszabadul.
- **Sebesség:** szókijelöléskor nem épül újra a teljes lista; a szerkesztések mentése rövid késleltetéssel összevonódik; az ismételt fordítások és könyvfordítások keresése gyorsítótárat kapott.
- **Offline működés:** az EPUB-olvasó függőségei a csomag részei. A service worker csak az alkalmazás saját régi gyorsítótárait takarítja, szerverhiba esetén a tárolt alkalmazást adja vissza, és hiányzó kép helyett nem küld HTML-t. Az alkalmazásfrissítés a Frissítés gombbal indítható.

## Ellenőrzés

**21 böngészős automatikus próba és 3 külön programteszt sikeres.** A böngészős ellenőrzés saját tesztadatokkal, helyi címen futott; nem az eredeti alkalmazás mentett adatait használta.

Ellenőrizve: profilkezelés, késleltetett mentés, CSV oda-vissza betöltés és kapcsolatok, hibás import, fordítási versenyhelyzetek, API-hibaválasz, mindkét régi könyvadatbázis migrációja, valódi próba-EPUB importja és megnyitása, formázás, könyvjelző, 5000 soros lista kijelölése, offline fájlok és 503-as szerverhiba kezelése. Az alkalmazás a tesztoldalon 390 képpont széles keretben is futott.

Külön kattintással is kipróbáltam a gyakorlás helyes válaszának ellenőrzését, a következő szót, a bezárást, a profilválasztó megnyitását, az irányváltást és a szókártya megfordítását.

Valódi Android/iPhone készüléken, éles mikrofonfelismeréssel és valamennyi külső fordítószolgáltató élő elérésével még szükséges próba. Az új online fordítás továbbra is internetet igényel; a javítás nem ad offline fordítómotort. A korábban már elveszett fordításokat a program nem tudja automatikusan visszaállítani.

## Későbbi fejlesztési lehetőségek

A teljes profil- és könyvmentés/visszaállítás, a hibák alapján ütemezett ismétlés és a tanulási statisztika külön következő fejlesztés lehet. Ezek nem részei ennek a hibajavító kiadásnak.

## Külső összetevők

A csomag az eredetileg használt JSZip 3.10.0 és epub.js 0.3.93 helyi példányát tartalmazza. A licencek a `vendor` mappában találhatók. Az eredeti manifestet és az ikonokat megtartottam.
