# Fullstack Open harjoitustyö

Tässä repositoriossa on Full Stack -websovelluskehitys harjoitustyöni. Kyseessä
on websovellus, jolla useampi käyttäjä voi luoda portfolio-nettisivuja järkevällä
käyttöliittymällä, erityisellä fokuksella sellaisiin portfolioihin, jotka
koostuvat peleistä ja/tai muista sovelluksista. Sovellus on toteutettu
frontendin osalta Reactilla, Bootstrapilla ja Typescriptillä, ja backendin
puolelta Axumilla, Sqlx:llä ja Rustilla.

## Työaikakirjanpito

Alla kirjanpito tähän projektiin käyttämistäni tunneista, kurssin
työtuntivaatimuksien seuraamista varten.

|   Päivä   |       Aikaväli        |Yhteensä | Kuvaus |
| :--------:|:----------------------|:--------|:-------|
| 18.7.2024 | 00.06–02.44 (158 min) | 2h 38m  | Npm/vite/typescript/cargo/docker/ym. järjestelyä |
| 18.7.2024 | 22.17–23.40 (83 min)  | 4h 1m   | Sovelluksen ydintoimintojen suunnittelua |
| 19.7.2024 | 01.04–03.29 (145 min) | 6h 26m  | Kunnon readme:n kirjoittaminen, tietokantayhteyksien lisääminen backendiin |
| 19.7.2024 | 16.53–02.54 (601 min) | 16h 27m | Kirjautumis- ja rekisteröintilomakkeiden toteutus frontendissä, käyttäjien lisäys ja salasanojen tarkistuksen toteuttaminen backendissä (ei vielä sessioita) |
| 20.7.2024 | 17.00–19.13 (133 min) | 18h 40m | Sessioiden lisäys backendiin, vielä vaiheessa frontissa |
| 21.7.2024 | 00.00–00.54 (54 min)  | 19h 34m | Sessiot toimintaan myös frontin osalta |
| 21.7.2024 | 17.23–21.51 (268 min) | 24h 2m  | Frontendin bäkkärikutsujen tekemistä varten olevan hookin refaktorointi, nyt integroi paljon paremmin Reactin state-systeemien kanssa, login-kontekstin lisäys, sessioiden vanhentuminen backendiin |
| 22.7.2024 | 09.17–11.17 (120 min) | 26h 2m  | Käännösten (ja niiden vaatimien systeemien) lisäämistä frontendiin, navipalkki, routeeminen |
| 22.7.2024 | 14.09–14.57 (48 min)  | 26h 50m | Käännösten viimeistely, faviconin/"brand ikonin" etsintää ja lisäystä |
| 23.7.2024 | 10.22–11.10 (48 min)  | 27h 38m | Portfolio-listaus-näkymän työstämistä frontendissä |
| 24.7.2024 | 21.03–23.00 (117 min) | 29h 35m | Portfolio-listaus-näkymän viimeistelyä, portfolio-skeeman suunnittelua backendiin |
| 26.7.2024 | 18.33–21.56 (203 min) | 32h 58m | Portfolioiden haun toteutus backendissä, portfolioiden haku backendista sekä esimerkkipohjaisen tyyppitarkistussysteemin toteutus frontendissä |
| 29.7.2024 | 13.34–17.22 (228 min) | 36h 46m | Api-kutsujen korjailua hitaan netin kanssa tunnistettujen ongelmien osalta, portfolioiden luonti/muokkaus-lomakkeen kehitystä |
| 29.7.2024 | 22.16–23.35 (79 min)  | 38h 5m  | Portfolioiden luomis-ominaisuus (vielä ilman itse teoksia) valmiiksi |

## Linkki ja ohjeet

*TODO: Linkki deployattuun versioon*

*TODO: Perus käyttöohjeet testaamista varten*

### Ylläpitohuomioita

#### Tietokantayhteydet

Tämän sovelluksen backend voi käyttää MySQL, PostgreSQL, tai SQLite
-tietokantaa. Käytetty tietokanta riippuu backendin saamasta DATABASE_URL
ympäristömuuttujasta, jonka muodostamiseen löytyy ohjeet seuraavista linkeistä:
[MySQL](https://docs.rs/sqlx/latest/sqlx/mysql/struct.MySqlConnectOptions.html),
[PostgreSQL](https://docs.rs/sqlx/latest/sqlx/postgres/struct.PgConnectOptions.html),
[SQLite](https://docs.rs/sqlx/latest/sqlx/sqlite/struct.SqliteConnectOptions.html).

Kehitysympäristön docker compose -konfiguraatiossa käytetään SQLite-tietokantaa,
joka tallentuu bind-mountattuun tiedostoon
[backend/dev-compose-data.db](backend/dev-compose-data.db).

## Kuvakaappauksia

*TODO: Kuvia sovelluksen käyttöliittymästä ja sillä luodusta portfoliosivusta, kunhan nämä on valmiita*

## Lisenssi

Tätä websovellusta saa käyttää, tutkia, kopioda ja muokata [GNU AGPL
3.0](LICENSE.md) lisenssin ehtojen mukaisesti.
