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

|   Päivä   |        Aikaväli         |  Yhteensä   | Kuvaus  |
| :--------:|:------------------------|:------------|:--------|
| 18.7.2024 | 00.06 - 02.44 (158 min) | 2 h 38 min  | Npm/vite/typescript/cargo/docker/ym. järjestelyä |
| 18.7.2024 | 22.17 - 23.40 (83 min)  | 4 h 1 min   | Sovelluksen ydintoimintojen suunnittelua |
| 19.7.2024 | 01.04 - 03.29 (145 min) | 6 h 26 min  | Kunnon readme:n kirjoittaminen, tietokantayhteyksien lisääminen backendiin |
| 19.7.2024 | 16.53 - 02.54 (601 min) | 16 h 27 min | Kirjautumis- ja rekisteröintilomakkeiden toteutus frontendissä, käyttäjien lisäys ja salasanojen tarkistuksen toteuttaminen backendissä (ei vielä sessioita) |
| 20.7.2024 | 17.00 - 19.13 (133 min) | 18 h 40 min | Sessioiden lisäys backendiin, vielä vaiheessa frontissa |
| 21.7.2024 | 00.00 - 00.54 (54 min)  | 19 h 34 min | Sessiot toimintaan myös frontin osalta |
| 21.7.2024 | 17.23 - 21.51 (268 min) | 24 h 2 min  | Frontendin bäkkärikutsujen tekemistä varten olevan hookin refaktorointi, nyt integroi paljon paremmin Reactin state-systeemien kanssa, login-kontekstin lisäys, sessioiden vanhentuminen backendiin |
| 22.7.2024 | 09.17 - 11.17 (120 min) | 26 h 2 min  | Käännösten (ja niiden vaatimien systeemien) lisäämistä frontendiin, navipalkki, routeeminen |
| 22.7.2024 | 14.09 - 14.57 (48 min)  | 26 h 50 min | Käännösten viimeistely, faviconin/"brand ikonin" etsintää ja lisäystä |
| 23.7.2024 | 10.22 - 11.10 (48 min)  | 27 h 38 min | Portfolio-listaus-näkymän työstämistä frontendissä |
| 24.7.2024 | 21.03 - 23.00 (117 min) | 29 h 35 min | Portfolio-listaus-näkymän viimeistelyä, portfolio-skeeman suunnittelua backendiin |
| 26.7.2024 | 18.33 - 21.56 (203 min) | 32 h 58 min | Portfolioiden haun toteutus backendissä, portfolioiden haku backendista sekä esimerkkipohjaisen tyyppitarkistussysteemin toteutus frontendissä |

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
