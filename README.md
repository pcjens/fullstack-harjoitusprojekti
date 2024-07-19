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

|   Päivä   |        Aikaväli         |  Yhteensä  | Kuvaus  |
| :--------:|:-----------------------:|:-----------|:--------|
| 18.7.2024 | 00.06 - 02.44 (158 min) | 2 h 38 min | Npm/vite/typescript/cargo/docker/ym. järjestelyä |
| 18.7.2024 | 22.17 - 23.40 (83 min)  | 4 h 1 min  | Sovelluksen ydintoimintojen suunnittelua |
| 19.7.2024 | 01.04 - 03.29 (145 min) | 6 h 26 min | Kunnon readme:n kirjoittaminen, tietokantayhteyksien lisääminen backendiin |

## Linkki ja ohjeet

*TODO: Linkki deployattuun versioon*

*TODO: Perus käyttöohjeet testaamista varten*

### Ylläpitohuomioita

#### Tietokantayhteydet

Backendin käyttämä tietokanta voi olla MySQL, PostgreSQL, tai SQLite
-tietokanta. Mitä tietokantaa käytetään, riippuu backendin saamasta DATABASE_URL
ympäristömuuttujasta, jonka formaattiin löytyy ohjeet seuraavista linkeistä:
[MySQL](https://docs.rs/sqlx/latest/sqlx/mysql/struct.MySqlConnectOptions.html),
[PostgreSQL](https://docs.rs/sqlx/latest/sqlx/postgres/struct.PgConnectOptions.html),
[SQLite](https://docs.rs/sqlx/latest/sqlx/sqlite/struct.SqliteConnectOptions.html).
Mikäli DATABASE_URL ei ole määritelty, käytetään muistissa olevaan SQLite
tietokantaa, joka tietenkin tyhjenee kun backend kaatuu tai sammutetaan.

Kehitysympäristön docker compose -konfiguraatiossa käytetään SQLite-tietokantaa,
joka tallentuu bind-mountattuun tiedostoon
[backend/dev-compose-data.db](backend/dev-compose-data.db).

## Kuvakaappauksia

*TODO: Kuvia sovelluksen käyttöliittymästä ja sillä luodusta portfoliosivusta, kunhan nämä on valmiita*

## Lisenssi

Tätä websovellusta saa käyttää, tutkia, kopioda ja muokata [GNU AGPL
3.0](LICENSE.md) lisenssin ehtojen mukaisesti.
