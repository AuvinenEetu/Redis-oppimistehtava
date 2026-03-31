# Redis - Vedonlyöntisovellus

Tämä kansio sisältää esimerkin Node + Express -sovelluksesta, joka voi tehdä kyselyitä mongodb tietokantaan ja nopeuttaa niitä käyttäen redistä.
(HUOM! Tarvitset tämän projektin testaamista varten toisen oppimistehtäväni Mongo_oppimistyo https://github.com/AuvinenEetu/mongo_oppimistyo)

1. docker compose up -d
2. Asenna riippuvuudet: npm install
3. Käynnistä sovellus: npm run dev:all
4. avaa http://localhost:8080/ selaimessa
5. testaa hakujen nopeutta klikkailemalla bets, events, users ja top events painikkeita. Painikkeiden alla näkyy haun nopeus ja tieto siitä kummasta kannasta data on palautettu