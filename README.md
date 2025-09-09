Inlämningsuppgift
I den här inlämningsuppgiften får ni möjlighet att använda er av de koncept och verktyg som vi har gått igenom. Välj ett av nedanstående tre teman och utveckla sedan ett smart kontrakt i Solidity:

Utveckla ett kontrakt som fungerar som en prenumerationsplattform, där vem som helst kan skapa sin egen prenumerationstjänst.
Varje skapad prenumerationstjänst ska ha en ägare, en avgift och en periodlängd (t.ex. 30 dagar), samt kunna pausas eller återupptas individuellt. Kontraktet ska ha funktioner för att betala för eller förlänga en prenumeration, kontrollera om en adress har en aktiv prenumeration, samt hämta slutdatum för aktiva prenumerationer. Det ska även vara möjligt att ge bort en prenumeration till någon annan. Skaparen av en prenumerationstjänst ska kunna ändra avgiften för prenumerationen, pausa eller återuppta just sin tjänst, samt ta ut de intäkter som har samlats in för den aktuella prenumerationen.
 
Utveckla ett kontrakt som fungerar som en marknadsplats för säker betalning mellan köpare och säljare.
Samtliga användare ska kunna lägga ut varor till försäljning, och en köpare ska kunna skicka pengar till kontraktet för att starta en affär. När säljaren markerar varan som skickad, och köparen bekräftar att den är mottagen, ska betalningen släppas till säljaren. Det ska även vara möjligt att avbryta affären och återbetala pengarna innan varan har markerats som skickad. Om en tvist uppstår ska en administratör kunna avgöra ärendet och antingen släppa pengarna till säljaren eller återbetala köparen.
 
Utveckla ett kontrakt som fungerar som ett poängsystem för medlemmar, med möjlighet att byta in poäng mot belöningar.
Vem som helst ska kunna gå med som medlem. Medlemmar ska kunna tjäna in poäng genom en funktion i kontraktet och själva kunna se sitt poängsaldo. Poäng ska dessutom kunna överföras mellan medlemmar, och en administratör ska kunna tilldela poäng vid behov. Kontraktet ska även innehålla en funktion för att byta in poäng mot belöningar (t.ex. T-shirt eller VIP-status), vilket nollställer eller minskar medlemmens poängsaldo.
 

Grundläggande krav (G):
Kontraktet ska innehåll följande element:

Minst en struct eller enum
Minst en mapping eller array
En constructor
Minst en custom modifier
Minst ett event för att logga viktiga händelser
Utöver ovanstående krav ska ni även skriva tester för kontraktet som täcker grundläggande funktionalitet. Säkerställer att alla viktiga funktioner fungerar som förväntat, samt att ni har ett test coverage på minst 40%.

 

För att nå VG ska ni uppfylla samtliga krav för G-nivå, samt:

Kontraktet ska innehålla minst ett custom error, samt minst en require, en assert, och en revert
Kontraktet ska innehålla en fallback och/eller receive funktion
Distribuera ert smarta kontrakt till Sepolia och verifiera kontraktet på Etherscan. Länka till den verifierade kontraktssidan i er inlämning.
Säkerställ att ert kontrakt har ett test coverage på minst 90%.
Identifiera och implementera minst tre gasoptimeringar och/eller säkerhetsåtgärder i ert kontrakt (användning av senaste versionen av solidity eller optimizer räknas ej!). Förklara vilka åtgärder ni har vidtagit, varför de är viktiga, och hur de förbättrar gasanvändningen och/eller kontraktets säkerhet.
 

Inlämning med publik GitHub-länk går bra, men bifoga då även .sol + test filen/filerna på itslearning. Om ni väljer att inte länka till ett GitHub repo, skicka in en zippad mapp med projektet, exkl node modules.

 

Lämna in ert projekt, inklusive källkod, en förklaring till era gasoptimeringar eller säkerhetsåtgärder, samt en länk till det verifierade kontraktet på Etherscan (om ni siktar på VG), senast 19 september 2025 kl 23.59.